"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Plus, Edit, Trash2, LogOut, Gift, Eye, Users, TrendingUp, Loader2 } from "lucide-react"
import { logout } from "@/actions/login/auth"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, AreaChart, Area, LabelList } from "recharts"

// =========================
// Tipos
// =========================
interface ColaboradorDashboardProps {
  onLogout: () => void
  colaboradorName: string
  /** Pásame el id del negocio para pedir estadísticas/filtrar. */
  idNegocio?: string
}

interface Cupon {
  id: number
  titulo: string
  descripcion: string
  descuento: string
  validoHasta: string
  estado: "activo" | "pausado" | "vencido"
  usos: number
}

type ApiRank = Record<string, string> // {"titulo": "numero_de_canjes"} * 5
type ApiHistorico = Record<string, [string, number]> // {"fecha-hora":[titulo, monto_descuento]}
interface ApiStatsResponse {
  num_canjes_total_de_todas_las_promociones: string
  "5_promociones_con_mas_canjes": ApiRank
  "5_promociones_con_menos_canjes": ApiRank
  "historico de canjes_ultimos_siete_dias": ApiHistorico
}

interface ApiPromocion {
  id: number
  nombre: string
  descripcion: string
  fecha_inicio: string   // ISO
  fecha_fin: string      // ISO
  tipo: string | null
  porcentaje: string | null  // "15.00"
  precio: string | null      // "85.00000"
  activo: boolean
  numero_canjeados: number
}

// =========================
// Helpers
// =========================
function toHorizontalBarData(rank: ApiRank) {
  return Object.entries(rank).map(([titulo, canjes]) => ({
    name: titulo,
    value: Number(canjes ?? 0),
  }))
}

function toDailyAreaData(hist: ApiHistorico) {
  const map = new Map<string, { date: string; totalMonto: number; count: number }>()
  Object.entries(hist).forEach(([fechaHora, [_titulo, monto]]) => {
    const d = new Date(fechaHora)
    const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
    const prev = map.get(key) ?? { date: key, totalMonto: 0, count: 0 }
    prev.totalMonto += Number(monto ?? 0)
    prev.count += 1
    map.set(key, prev)
  })
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1))
}

const fmtYYYYMMDD = (iso: string) => {
  try { return new Date(iso).toISOString().slice(0,10) } catch { return "" }
}

const deriveEstado = (activo: boolean, fechaFinISO: string): Cupon["estado"] => {
  const hoy = new Date()
  const fin = new Date(fechaFinISO)
  if (isNaN(fin.getTime())) return activo ? "activo" : "pausado"
  if (fin < hoy) return "vencido"
  return activo ? "activo" : "pausado"
}

const deriveDescuento = (porcentaje: string | null, precio: string | null) => {
  if (porcentaje && !isNaN(Number(porcentaje))) {
    return `${Number(porcentaje)}%`
  }
  if (precio && !isNaN(Number(precio))) {
    return `$${Number(precio)}`
  }
  return "—"
}

const mapApiToCupon = (p: ApiPromocion): Cupon => ({
  id: p.id,
  titulo: p.nombre,
  descripcion: p.descripcion,
  descuento: deriveDescuento(p.porcentaje, p.precio),
  validoHasta: fmtYYYYMMDD(p.fecha_fin),
  estado: deriveEstado(p.activo, p.fecha_fin),
  usos: p.numero_canjeados ?? 0,
})

// Fetch POST helper
async function postJSON<T>(url: string, data: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`, // <- descomenta si tu API lo requiere
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(data),
    ...init,
  })
  if (!res.ok) {
    // if (res.status === 401 || res.status === 403) await logout() // opcional
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json()
}

// =========================
// Configs de chart
// =========================
const areaConfig: ChartConfig = {
  totalMonto: { label: "Monto descuento", color: "rgb(32, 178, 170)" },
}

const barBestConfig: ChartConfig = {
  value: { label: "Canjes (mejores)", color: "rgb(35, 103, 242)" },
}

const barWorstConfig: ChartConfig = {
  value: { label: "Canjes (peores)", color: "rgb(122, 62, 242)" },
}

// =========================
// Componente principal
// =========================
export function ColaboradorDashboard({
  onLogout,
  colaboradorName,
  idNegocio = "3", // <- default a 3 para tu ejemplo del endpoint
}: ColaboradorDashboardProps) {
  // ====== Estado cupones desde API ======
  const [cupones, setCupones] = useState<Cupon[]>([])
  const [loadingCupones, setLoadingCupones] = useState(false)
  const [errorCupones, setErrorCupones] = useState<string | null>(null)

  // ====== Estado del modal/CRUD local (UI sobre arreglo cargado) ======
  const [isCreating, setIsCreating] = useState(false)
  const [editingCupon, setEditingCupon] = useState<Cupon | null>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    descuento: "",
    validoHasta: "",
  })

  // ====== Estado estadísticas (API real) ======
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [totalCanjes, setTotalCanjes] = useState<number>(0)
  const [top5, setTop5] = useState<{ name: string; value: number }[]>([])
  const [bottom5, setBottom5] = useState<{ name: string; value: number }[]>([])
  const [historico, setHistorico] = useState<{ date: string; totalMonto: number; count: number }[]>([])

  // ====== Fetch promociones (BD real) ======
  useEffect(() => {
    let cancelled = false

    async function fetchPromociones() {
      try {
        setLoadingCupones(true)
        setErrorCupones(null)

        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ""
        const url = `${baseUrl}/functionality/list/promociones`
        const res = await fetch(url, { method: "GET" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: ApiPromocion[] = await res.json()
        if (cancelled) return

        const mapped = json.map(mapApiToCupon)
        setCupones(mapped)

        // Si deseas que el KPI venga SOLO del endpoint de estadísticas, comenta estas 2 líneas:
        const total = json.reduce((acc, p) => acc + (p.numero_canjeados ?? 0), 0)
        setTotalCanjes(total)
      } catch (e: any) {
        if (!cancelled) setErrorCupones(e?.message ?? "Error cargando promociones")
      } finally {
        if (!cancelled) setLoadingCupones(false)
      }
    }

    fetchPromociones()
    return () => { cancelled = true }
  }, [idNegocio])

  // ====== Fetch estadísticas (REAL) ======
  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        setLoadingStats(true)
        setStatsError(null)

        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ""
        const url = `${baseUrl}/functionality/promociones/estadisticas/`

        const negocioId = Number(idNegocio || "3")
        if (!Number.isFinite(negocioId) || negocioId <= 0) {
          throw new Error("id_negocio inválido")
        }

        const payload = { id_negocio: negocioId }
        const json = await postJSON<ApiStatsResponse>(url, payload)
        if (cancelled) return

        const total = Number(json.num_canjes_total_de_todas_las_promociones ?? 0)
        setTotalCanjes(Number.isFinite(total) ? total : 0)

        setTop5(toHorizontalBarData(json["5_promociones_con_mas_canjes"] ?? {}))
        setBottom5(toHorizontalBarData(json["5_promociones_con_menos_canjes"] ?? {}))
        setHistorico(toDailyAreaData(json["historico de canjes_ultimos_siete_dias"] ?? {}))
      } catch (err: any) {
        if (!cancelled) setStatsError(err?.message ?? "Error al cargar estadísticas")
      } finally {
        if (!cancelled) setLoadingStats(false)
      }
    }
    fetchStats()
    return () => { cancelled = true }
  }, [idNegocio])

  // ====== Stats locales de los cupones (UI) ======
  const statsLocal = useMemo(() => {
    return {
      totalCupones: cupones.length,
      cuponesActivos: cupones.filter((c) => c.estado === "activo").length,
      totalUsos: cupones.reduce((acc, c) => acc + c.usos, 0),
    }
  }, [cupones])

  // ====== Handlers CRUD (local, UI) ======
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCupon) {
      setCupones((prev) =>
        prev.map((cupon) => (cupon.id === editingCupon.id ? { ...cupon, ...formData } : cupon))
      )
      setEditingCupon(null)
    } else {
      const newCupon: Cupon = {
        id: Date.now(),
        ...formData,
        estado: "activo",
        usos: 0,
      }
      setCupones((prev) => [...prev, newCupon])
    }
    setFormData({ titulo: "", descripcion: "", descuento: "", validoHasta: "" })
    setIsCreating(false)
  }

  const handleEdit = (cupon: Cupon) => {
    setEditingCupon(cupon)
    setFormData({
      titulo: cupon.titulo,
      descripcion: cupon.descripcion,
      descuento: cupon.descuento,
      validoHasta: cupon.validoHasta,
    })
    setIsCreating(true)
  }

  const handleDelete = (id: number) => {
    setCupones((prev) => prev.filter((cupon) => cupon.id !== id))
  }

  const toggleEstado = (id: number) => {
    setCupones((prev) =>
      prev.map((cupon) =>
        cupon.id === id ? { ...cupon, estado: cupon.estado === "activo" ? "pausado" : "activo" } : cupon
      )
    )
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold">B</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">Panel de Colaborador</h1>
              <p className="text-xs text-muted-foreground">Hola, {colaboradorName}</p>
            </div>
          </div>
          <form action={logout}>
            <Button variant="outline" type="submit" className="gap-2">
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-muted/60 hover:shadow-sm transition">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Cupones</p>
                  <p className="text-2xl font-semibold">{statsLocal.totalCupones}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted/60 hover:shadow-sm transition">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Cupones Activos</p>
                  <p className="text-2xl font-semibold">{statsLocal.cuponesActivos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted/60 hover:shadow-sm transition">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Usos (mock)</p>
                  <p className="text-2xl font-semibold">{statsLocal.totalUsos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted/60 hover:shadow-sm transition relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Canjes totales (API)</p>
                  <p className="text-2xl font-semibold">
                    {loadingStats ? (
                      <span className="text-sm text-muted-foreground">Cargando…</span>
                    ) : statsError ? (
                      <span className="text-sm text-destructive">{statsError}</span>
                    ) : (
                      totalCanjes.toLocaleString()
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Histórico (área) */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Histórico de canjes (últimos 7 días)</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingStats ? (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
                </div>
              ) : statsError ? (
                <div className="text-destructive text-sm">{statsError}</div>
              ) : (
                <ChartContainer config={areaConfig} className="h-[260px] w-full">
                  <AreaChart data={historico} margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={28}
                      tickFormatter={(v: string) =>
                        new Date(v).toLocaleDateString("es-MX", { month: "short", day: "numeric" })
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(v) =>
                            new Date(v as string).toLocaleDateString("es-MX", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                      }
                    />
                    <defs>
                      <linearGradient id="fillTotalMonto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-totalMonto)" stopOpacity={0.85} />
                        <stop offset="95%" stopColor="var(--color-totalMonto)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <Area
                      dataKey="totalMonto"
                      type="natural"
                      fill="url(#fillTotalMonto)"
                      fillOpacity={0.4}
                      stroke="var(--color-totalMonto)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Top 5 (barra horizontal) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Top 5 con más canjes</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingStats ? (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
                </div>
              ) : (
                <ChartContainer config={barBestConfig} className="h-[260px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={[...top5].sort((a, b) => a.value - b.value)}
                    layout="vertical"
                    margin={{ left: 0, right: 16, top: 10, bottom: 10 }}
                  >
                    <XAxis type="number" dataKey="value" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      width={120}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="value" fill="var(--color-value)" radius={6}>
                      <LabelList position="right" className="fill-foreground text-xs" />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom 5 (barra horizontal) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top 5 con menos canjes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingStats ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
              </div>
            ) : (
              <ChartContainer config={barWorstConfig} className="h-[220px] w-full">
                <BarChart
                  accessibilityLayer
                  data={[...bottom5].sort((a, b) => a.value - b.value)}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 10, bottom: 10 }}
                >
                  <XAxis type="number" dataKey="value" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    width={140}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={6}>
                    <LabelList position="right" className="fill-foreground text-xs" />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Header de cupones */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold tracking-tight">Mis Cupones</h2>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                onClick={() => {
                  setEditingCupon(null)
                  setFormData({ titulo: "", descripcion: "", descuento: "", validoHasta: "" })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cupón
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCupon ? "Editar Cupón" : "Crear Nuevo Cupón"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título del cupón</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="descuento">Descuento</Label>
                    <Input
                      id="descuento"
                      value={formData.descuento}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, descuento: e.target.value }))
                      }
                      placeholder="ej: 20%, $50, 2x1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validoHasta">Válido hasta</Label>
                    <Input
                      id="validoHasta"
                      type="date"
                      value={formData.validoHasta}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, validoHasta: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingCupon ? "Actualizar" : "Crear"} Cupón
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de cupones */}
        {loadingCupones && (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Cargando promociones…
            </CardContent>
          </Card>
        )}

        {!loadingCupones && errorCupones && (
          <Card>
            <CardContent className="p-10 text-center text-destructive">
              {errorCupones}
            </CardContent>
          </Card>
        )}

        {!loadingCupones && !errorCupones && cupones.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cupones.map((cupon) => (
              <Card key={cupon.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg leading-tight">{cupon.titulo}</CardTitle>
                    <Badge
                      variant={
                        cupon.estado === "activo" ? "default" : cupon.estado === "pausado" ? "secondary" : "destructive"
                      }
                    >
                      {cupon.estado}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">{cupon.descripcion}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Descuento:</span>
                      <span className="font-semibold text-green-600">{cupon.descuento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Válido hasta:</span>
                      <span>{cupon.validoHasta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usos:</span>
                      <span className="font-semibold">{cupon.usos}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(cupon)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>

                    {cupon.estado !== "vencido" && (
                      <Button
                        size="sm"
                        variant={cupon.estado === "activo" ? "secondary" : "default"}
                        onClick={() => toggleEstado(cupon.id)}
                      >
                        {cupon.estado === "activo" ? "Pausar" : "Activar"}
                      </Button>
                    )}

                    <Button size="sm" variant="destructive" onClick={() => handleDelete(cupon.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loadingCupones && !errorCupones && cupones.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes cupones aún</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer cupón para que los usuarios puedan canjearlo
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear mi primer cupón
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
