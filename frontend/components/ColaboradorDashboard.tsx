"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2, RefreshCw, TrendingUp } from "lucide-react"
import { logout } from "@/actions/login/auth"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  LabelList,
} from "recharts"
import { getEstadisticas, type EstadisticasResponse } from "@/actions/colaboradores/get-estadisticas"

// =========================
// Tipos
// =========================
interface ColaboradorDashboardProps {
  onLogout: () => void
  colaboradorName: string
  idNegocio?: string
}

// =========================
// Utilidades locales
// =========================
const fmtNumber = (n: number) =>
  new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(n)

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n)

const fmtDateShort = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" })
}

export function ColaboradorDashboard({
  onLogout,
  colaboradorName,
  idNegocio = "3",
}: ColaboradorDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<EstadisticasResponse | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getEstadisticas(/* puedes pasar idNegocio si tu acción lo requiere */)
      setStats(data)
    } catch (e: any) {
      console.error(e)
      setError("No se pudieron cargar las estadísticas.")
    } finally {
      setLoading(false)
    }
  }, [idNegocio])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // =========================
  // Normalizadores / datasets
  // =========================
  const totalCanjes = useMemo(() => {
    if (!stats) return 0
    const n = Number((stats as any).num_canjes_total_de_todas_las_promociones ?? 0)
    return Number.isFinite(n) ? n : 0
  }, [stats])

  const topMasData = useMemo(() => {
    const arr = stats?.["5_promociones_con_mas_canjes"] ?? []
    return arr.map((p) => ({
      titulo: p.titulo,
      canjes: Number(p.numero_de_canjes ?? 0),
    }))
  }, [stats])

  const topMenosData = useMemo(() => {
    const arr = stats?.["5_promociones_con_menos_canjes"] ?? []
    return arr.map((p) => ({
      titulo: p.titulo,
      canjes: Number(p.numero_de_canjes ?? 0),
    }))
  }, [stats])

  /**
   * Historico: { "fecha-hora": [titulo, monto_descuento] }
   * Agrupamos por YYYY-MM-DD
   */
  const historicoData = useMemo(() => {
    const src = stats?.historico_de_canjes_ultimos_siete_dias ?? []
    const byDate = new Map<string, { date: string; canjes: number; monto_total_descuento: number }>()

    for (const item of src) {
      for (const [fechaHora, value] of Object.entries(item)) {
        const dateObj = new Date(fechaHora)
        const key = Number.isNaN(dateObj.getTime())
          ? String(fechaHora).slice(0, 10)
          : dateObj.toISOString().slice(0, 10)

        const monto = Array.isArray(value) ? Number(value[1] ?? 0) : 0
        const current = byDate.get(key) ?? { date: key, canjes: 0, monto_total_descuento: 0 }
        current.canjes += 1
        current.monto_total_descuento += Number.isFinite(monto) ? monto : 0
        byDate.set(key, current)
      }
    }

    return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1))
  }, [stats])

  // =========================
  // Chart configs (SHADCN)
  // =========================
  const barConfig: ChartConfig = {
    canjes: { label: "Canjes", color: "hsl(var(--chart-1))" },
  }

  const areaConfig: ChartConfig = {
    canjes: { label: "Canjes", color: "var(--chart-1)" },
    monto_total_descuento: { label: "Monto total", color: "var(--chart-2)" },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            Estadísticas de promociones (últimos 7 días)
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Actualizar</span>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">{error}</CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total de canjes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-16 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="text-4xl font-bold tracking-tight">{fmtNumber(totalCanjes)}</div>
              )}
              <p className="text-xs text-muted-foreground mt-2">Suma en todas las promociones.</p>
            </CardContent>
          </Card>

          {/* Puedes sumar otros KPIs cuando el API los exponga (p.ej. monto total, promociones activas, etc.) */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Promociones con canjes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight">
                {loading ? <span className="opacity-60">—</span> : fmtNumber(topMasData.length + topMenosData.length)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Con al menos un canje registrado.</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Rango observado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight">
                {loading || historicoData.length === 0 ? "—" : `${fmtDateShort(historicoData[0].date)} – ${fmtDateShort(historicoData[historicoData.length - 1].date)}`}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Últimos 7 días con actividad.</p>
            </CardContent>
          </Card>
        </div>

        {/* Top + Histórico + Top */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top 5 con más canjes */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Top 5: más canjes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={barConfig} className="h-64 w-full">
                <BarChart data={topMasData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="titulo"
                    tickLine={false}
                    axisLine={false}
                    height={64}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 16) + "…" : v)}
                  />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="canjes" fill="var(--color-canjes)" radius={6}>
                    <LabelList dataKey="canjes" position="top" offset={8} className="fill-foreground text-xs" />
                  </Bar>
                </BarChart>
              </ChartContainer>
              {!loading && topMasData.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">Sin datos.</p>
              )}
            </CardContent>
          </Card>

          {/* Histórico 7 días: estilo AreaChart shadcn */}
          <Card className="lg:col-span-2 pt-0">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
              <div className="grid flex-1 gap-1">
                <CardTitle>Histórico de canjes – últimos 7 días</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer config={areaConfig} className="aspect-auto h-[260px] w-full">
                <AreaChart data={historicoData}>
                  <defs>
                    <linearGradient id="fillCanjes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--color-canjes)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-canjes)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillMonto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--color-monto_total_descuento)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-monto_total_descuento)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} />

                  {/* 👇 Esto hace que aparezcan los días como en shadcn */}
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={28}
                    interval="preserveStartEnd"
                    tickFormatter={(value: string) => {
                      // value viene como "YYYY-MM-DD"
                      const d = new Date(value)
                      return d.toLocaleDateString("es-MX", {
                        month: "short", // abr, may, jun...
                        day: "numeric", // 1, 2, 3...
                      })
                    }}
                  />

                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          const d = new Date(String(value))
                          return d.toLocaleDateString("es-MX", {
                            weekday: "short", // lun, mar...
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        }}
                        // Muestra $ para monto y número plano para canjes
                        formatter={(val, name) => {
                          const n = Number(val)
                          if (name === "monto_total_descuento") {
                            return new Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                              maximumFractionDigits: 0,
                            }).format(n)
                          }
                          return new Intl.NumberFormat("es-MX").format(n)
                        }}
                        indicator="dot"
                      />
                    }
                  />

                  <Area
                    dataKey="monto_total_descuento"
                    type="natural"
                    fill="url(#fillMonto)"
                    stroke="var(--color-monto_total_descuento)"
                    name="Monto total"
                  />
                  <Area
                    dataKey="canjes"
                    type="natural"
                    fill="url(#fillCanjes)"
                    stroke="var(--color-canjes)"
                    name="Canjes"
                  />

                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
              {!loading && historicoData.length === 0 && (
                <p className="text-sm text-muted-foreground mt-3">Sin datos de los últimos 7 días.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top 5 con menos canjes */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Top 5: menos canjes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={barConfig} className="h-64 w-full">
                <BarChart data={topMenosData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="titulo"
                    tickLine={false}
                    axisLine={false}
                    height={80}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + "…" : v)}
                  />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="canjes" fill="var(--color-canjes)" radius={6}>
                    <LabelList dataKey="canjes" position="top" offset={8} className="fill-foreground text-xs" />
                  </Bar>
                </BarChart>
              </ChartContainer>
              {!loading && topMenosData.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">Sin datos.</p>
              )}
            </CardContent>
          </Card>

          {/* puedes dejar un espacio para más tarjetas o tablas futuras */}
          <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Próximamente</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Tabla de canjes recientes / exportaciones / comparativas.
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Próximamente</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Desglose por sucursal o categoría.
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
