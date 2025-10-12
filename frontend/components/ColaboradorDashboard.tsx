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
  /** Pásame el id del negocio para pedir estadísticas. Default: "1" mientras integras auth */
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

// API de estadísticas (formato que compartiste)
type ApiRank = Record<string, string> // {"titulo": "numero_de_canjes"} * 5
type ApiHistorico = Record<string, [string, number]> // {"fecha-hora":[titulo, monto_descuento]}
interface ApiStatsResponse {
  num_canjes_total_de_todas_las_promociones: string
  "5_promociones_con_mas_canjes": ApiRank
  "5_promociones_con_menos_canjes": ApiRank
  "historico de canjes_ultimos_siete_dias": ApiHistorico
}

// =========================
// Helpers de transformación
// =========================
function toHorizontalBarData(rank: ApiRank) {
  // Convierte { "Titulo A": "12", "Titulo B": "7", ... } a [{name:"Titulo A", value:12}, ...]
  return Object.entries(rank).map(([titulo, canjes]) => ({
    name: titulo,
    value: Number(canjes ?? 0),
  }))
}

function toDailyAreaData(hist: ApiHistorico) {
  // Convierte {"2025-10-01T10:00": ["Promo", 30], ...}
  // a [{date:"2025-10-01", totalMonto: XX, count: YY}, ...] agrupado por día
  const map = new Map<string, { date: string; totalMonto: number; count: number }>()
  Object.entries(hist).forEach(([fechaHora, [_titulo, monto]]) => {
    const d = new Date(fechaHora)
    const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
    const prev = map.get(key) ?? { date: key, totalMonto: 0, count: 0 }
    prev.totalMonto += Number(monto ?? 0)
    prev.count += 1
    map.set(key, prev)
  })
  // Orden por fecha ascendente
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1))
}

// =========================
// Configs de chart (shad) + Paletas de marca
// =========================

// === Configs con RGB ===
const areaConfig: ChartConfig = {
  totalMonto: { label: "Monto descuento", color: "rgb(32, 178, 170)" }, // teal (puedes poner azul si prefieres)
};

const barBestConfig: ChartConfig = {
  value: { label: "Canjes (mejores)", color: "rgb(35, 103, 242)" }, // AZUL
};

const barWorstConfig: ChartConfig = {
  value: { label: "Canjes (peores)", color: "rgb(122, 62, 242)" },  // MORADO
};

const PALETTE = {
  best: {
    gradId: "barsBestGrad",
    from: "rgb(35, 103, 242)", // azul claro
    to:   "rgb(22, 72, 199)",  // azul más profundo
    stroke: "rgb(18, 60, 170)",
  },
  worst: {
    gradId: "barsWorstGrad",
    from: "rgb(122, 62, 242)", // morado
    to:   "rgb(88, 34, 202)",  // morado más profundo
    stroke: "rgb(72, 24, 180)",
  },
};


// =========================
// Componente principal
// =========================
export function ColaboradorDashboard({
  onLogout,
  colaboradorName,
  idNegocio = "1",
}: ColaboradorDashboardProps) {
  // ====== Estado cupones (mock local, igual que tu código) ======
  const [cupones, setCupones] = useState<Cupon[]>([
    {
      id: 1,
      titulo: "Descuento 20% en servicios",
      descripcion: "Obtén 20% de descuento en todos nuestros servicios de consultoría",
      descuento: "20%",
      validoHasta: "2025-12-31",
      estado: "activo",
      usos: 45,
    },
    {
      id: 2,
      titulo: "2x1 en consultoría",
      descripcion: "Paga una sesión de consultoría y obtén la segunda gratis",
      descuento: "50%",
      validoHasta: "2025-11-30",
      estado: "pausado",
      usos: 12,
    },
    {
      id: 3,
      titulo: "15% descuento primera compra",
      descripcion: "Descuento especial para nuevos clientes",
      descuento: "15%",
      validoHasta: "2025-10-15",
      estado: "vencido",
      usos: 28,
    },
  ])

  const [isCreating, setIsCreating] = useState(false)
  const [editingCupon, setEditingCupon] = useState<Cupon | null>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    descuento: "",
    validoHasta: "",
  })

  // ====== Estado estadísticas (desde API) ======
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [totalCanjes, setTotalCanjes] = useState<number>(0)
  const [top5, setTop5] = useState<{ name: string; value: number }[]>([])
  const [bottom5, setBottom5] = useState<{ name: string; value: number }[]>([])
  const [historico, setHistorico] = useState<{ date: string; totalMonto: number; count: number }[]>(
    []
  )

  // ====== Fetch estadísticas ======
  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        setLoadingStats(true)
        setStatsError(null)

        // Ajusta a tu endpoint real:
        // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/estadisticas`, {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ id_negocio: idNegocio }),
        // })

        // DEMO: simular respuesta con datos compatibles
        const demo: ApiStatsResponse = {
          num_canjes_total_de_todas_las_promociones: "367",
          "5_promociones_con_mas_canjes": {
            "2x1 Burgers": "120",
            "10% en Café": "88",
            "Envío Gratis": "64",
            "25% en Postres": "53",
            "BOGO Pizza": "41",
          },
          "5_promociones_con_menos_canjes": {
            "Combo Estudiante": "7",
            "Martes de Nachos": "9",
            "Descuento Ferias": "11",
            "Café de Temporada": "12",
            "Regalo Llaveros": "14",
          },
          "historico de canjes_ultimos_siete_dias": {
            "2025-10-05T10:25:00": ["2x1 Burgers", 50],
            "2025-10-05T13:00:00": ["10% en Café", 12],
            "2025-10-06T09:30:00": ["25% en Postres", 30],
            "2025-10-06T11:45:00": ["Envío Gratis", 15],
            "2025-10-07T18:10:00": ["BOGO Pizza", 60],
            "2025-10-08T12:00:00": ["2x1 Burgers", 25],
            "2025-10-08T13:30:00": ["10% en Café", 10],
            "2025-10-09T11:00:00": ["2x1 Burgers", 35],
            "2025-10-10T16:20:00": ["Envío Gratis", 20],
            "2025-10-11T10:05:00": ["25% en Postres", 18],
          },
        }

        // Si usas backend real:
        // if (!res.ok) throw new Error(`HTTP ${res.status}`)
        // const data: ApiStatsResponse = await res.json()

        const data = demo

        if (cancelled) return

        setTotalCanjes(Number(data.num_canjes_total_de_todas_las_promociones ?? 0))
        setTop5(toHorizontalBarData(data["5_promociones_con_mas_canjes"]))
        setBottom5(toHorizontalBarData(data["5_promociones_con_menos_canjes"]))
        setHistorico(toDailyAreaData(data["historico de canjes_ultimos_siete_dias"]))
      } catch (err: any) {
        if (!cancelled) setStatsError(err?.message ?? "Error al cargar estadísticas")
      } finally {
        if (!cancelled) setLoadingStats(false)
      }
    }
    fetchStats()
    return () => {
      cancelled = true
    }
  }, [idNegocio])

  // ====== Stats locales de los cupones (UI) ======
  const statsLocal = useMemo(() => {
    return {
      totalCupones: cupones.length,
      cuponesActivos: cupones.filter((c) => c.estado === "activo").length,
      totalUsos: cupones.reduce((acc, c) => acc + c.usos, 0),
    }
  }, [cupones])

  // ====== Handlers CRUD cupones ======
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
        {/* KPIs (locales + total API) */}
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
                    {loadingStats ? <span className="text-sm text-muted-foreground">Cargando…</span> : totalCanjes.toLocaleString()}
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
                  <AreaChart
                    data={historico}
                    margin={{ left: 12, right: 12, top: 10, bottom: 0 }}
                  >
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
                    data={[...top5].sort((a, b) => a.value - b.value)} // de menor a mayor para layout=vertical
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

        {cupones.length === 0 && (
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
