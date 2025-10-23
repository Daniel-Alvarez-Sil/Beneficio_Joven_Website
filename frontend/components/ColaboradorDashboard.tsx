"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2, RefreshCw, TrendingUp } from "lucide-react"
import { logout } from "@/actions/login/auth"
import { Legend } from "recharts"

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

/* =========================
   Zona horaria fija (UTC-6)
   ========================= */
const MX_TZ = "America/Mexico_City"

// Para ISO completos (con Z o +hh:mm), `new Date(iso)` es suficiente.
function parseISO(iso: string): Date {
  return new Date(iso)
}

// Construye YYYY-MM-DD **en MX_TZ** para agrupar por día local.
function ymdInTZ(d: Date, tz = MX_TZ): string {
  const parts = new Intl.DateTimeFormat("es-MX", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)

  const y = parts.find(p => p.type === "year")!.value
  const m = parts.find(p => p.type === "month")!.value
  const dd = parts.find(p => p.type === "day")!.value
  return `${y}-${m}-${dd}` // YYYY-MM-DD local MX
}

// Cuando tenemos **claves de día** "YYYY-MM-DD" (ya en MX local),
// creamos un Date seguro en **mediodía UTC** para evitar rollback de día al formatear.
function dateFromYmdLocalMX(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return new Date(NaN)
  const [_, Y, M, D] = m
  // 12:00 UTC = 06:00 MX aprox, sigue siendo el mismo día calendario en MX
  return new Date(Date.UTC(Number(Y), Number(M) - 1, Number(D), 12, 0, 0))
}

// Formateador corto que acepta ISO completo o YYYY-MM-DD (clave local MX)
const fmtDateShortMX = (s: string) => {
  const d = s.includes("T") ? parseISO(s) : dateFromYmdLocalMX(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString("es-MX", { timeZone: MX_TZ, month: "short", day: "numeric" })
}

/* =========================
   Tipos
   ========================= */
interface ColaboradorDashboardProps {
  onLogout: () => void
  colaboradorName: string
  idNegocio?: string
}

/* =========================
   Utilidades locales
   ========================= */
const fmtNumber = (n: number) =>
  new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(n)

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n)

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

  /* =========================
     Normalizadores / datasets
     ========================= */
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
   * Historico: { "fecha_hora": ISO, titulo, monto_descuento }  (Caso A)
   *            { "ISO date": [titulo, monto] } mezclado con otras claves (Caso B)
   * Se agrupa por YYYY-MM-DD **en America/Mexico_City**
   */
  const historicoData = useMemo(() => {
    const src = stats?.historico_de_canjes_ultimos_siete_dias ?? []
    const byDate = new Map<string, { date: string; canjes: number; monto_total_descuento: number }>()

    for (const item of src) {
      // Caso A
      if (
        item &&
        typeof item === "object" &&
        "fecha_hora" in item &&
        (typeof (item as any).fecha_hora === "string" || (item as any).fecha_hora instanceof Date)
      ) {
        const iso = String((item as any).fecha_hora)
        const d = parseISO(iso)
        if (!Number.isNaN(d.getTime())) {
          const key = ymdInTZ(d) // YYYY-MM-DD MX
          const monto = Number((item as any).monto_descuento ?? 0)
          const prev = byDate.get(key) ?? { date: key, canjes: 0, monto_total_descuento: 0 }
          prev.canjes += 1
          prev.monto_total_descuento += Number.isFinite(monto) ? monto : 0
          byDate.set(key, prev)
        }
        continue
      }

      // Caso B
      for (const [k, v] of Object.entries(item ?? {})) {
        const d = parseISO(k) // si k es ISO con zona, funciona; si no, será inválido y se ignora
        if (Number.isNaN(d.getTime())) continue
        const key = ymdInTZ(d) // YYYY-MM-DD MX
        const monto = Array.isArray(v) ? Number(v[1] ?? 0) : 0
        const prev = byDate.get(key) ?? { date: key, canjes: 0, monto_total_descuento: 0 }
        prev.canjes += 1
        prev.monto_total_descuento += Number.isFinite(monto) ? monto : 0
        byDate.set(key, prev)
      }
    }

    const arr = Array.from(byDate.values()).filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x.date))
    arr.sort((a, b) => (a.date < b.date ? -1 : 1))
    return arr
  }, [stats])

  /* =========================
     Chart configs (SHADCN)
     ========================= */
  const barConfig: ChartConfig = {
    canjes: { label: "Canjes", color: "hsl(var(--chart-1))" },
  }

  const areaConfig: ChartConfig = {
    canjes: { label: "Canjes", color: "var(--chart-1)" },
    monto_total_descuento: { label: "Monto total", color: "var(--chart-2)" },
  }

  return (
    <div className="min-h-screen relative text-white">
      {/* Fondo aurora reutilizando tu clase global */}
      <div className="auth-aurora" />
      <div className="auth-stars" />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/75">
            <TrendingUp className="w-4 h-4" />
            Estadísticas de promociones (últimos 7 días)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 border-white/30 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Actualizar</span>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="glass border border-red-400/30">
            <CardHeader>
              <CardTitle className="text-red-300">{error}</CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="glass border border-white/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">Total de canjes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-16 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white/70" />
                </div>
              ) : (
                <div className="text-4xl font-bold tracking-tight text-white/70">{fmtNumber(totalCanjes)}</div>
              )}
              <p className="text-xs text-white/60 mt-2">Suma en todas las promociones.</p>
            </CardContent>
          </Card>

          <Card className="glass border border-white/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">Promociones con canjes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight text-white/70">
                {loading ? <span className="opacity-60 text-white/70">—</span> : fmtNumber(topMasData.length + topMenosData.length)}
              </div>
              <p className="text-xs text-white/60 mt-2">Con al menos un canje registrado.</p>
            </CardContent>
          </Card>

          <Card className="glass border border-white/15">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">Rango observado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight text-white/70">
                {loading || historicoData.length === 0
                  ? "—"
                  : `${fmtDateShortMX(historicoData[0].date)} – ${fmtDateShortMX(historicoData[historicoData.length - 1].date)}`}
              </div>
              <p className="text-xs text-white/60 mt-2">Últimos 7 días con actividad.</p>
            </CardContent>
          </Card>
        </div>

        {/* Top + Histórico + Top */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top 5 con más canjes */}
          <Card className="glass border border-white/15 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Top 5: más canjes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={barConfig}
                className="h-64 w-full"
                style={
                  {
                    "--color-canjes": "#38bdf8",
                  } as React.CSSProperties
                }
              >
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
                    tick={{ fill: "rgba(255,255,255,.75)" }}
                    tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 16) + "…" : v)}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,.75)" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="canjes" fill="var(--color-canjes)" radius={6}>
                    <LabelList dataKey="canjes" position="top" offset={8} className="fill-white text-xs" />
                  </Bar>
                </BarChart>
              </ChartContainer>
              {!loading && topMasData.length === 0 && (
                <p className="text-sm text-white/70 mt-2">Sin datos.</p>
              )}
            </CardContent>
          </Card>

          {/* Histórico 7 días */}
          <Card className="glass border border-white/15 lg:col-span-2 pt-0">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b border-white/10 py-5 sm:flex-row">
              <div className="grid flex-1 gap-1">
                <CardTitle className="text-white">Histórico de canjes – últimos 7 días</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer
                config={areaConfig}
                className="chart-dark aspect-auto h-[260px] w-full"
                style={
                  {
                    "--color-canjes": "#38bdf8",
                    "--color-monto_total_descuento": "#a056ebff",
                  } as React.CSSProperties
                }
              >
                <AreaChart data={historicoData}>
                  <defs>
                    <linearGradient id="fillCanjes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-canjes)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-canjes)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillMonto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-monto_total_descuento)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-monto_total_descuento)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="rgba(255,255,255,0.1)" vertical={false} />

                  {/* Eje X (fechas) */}
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={28}
                    interval="preserveStartEnd"
                    tick={{ fill: "rgba(255,255,255,.75)" }}
                    tickFormatter={(value: string) => {
                      // value es la clave YYYY-MM-DD (local MX)
                      const d = dateFromYmdLocalMX(value)
                      return d.toLocaleDateString("es-MX", {
                        timeZone: MX_TZ,
                        month: "short",
                        day: "numeric",
                      })
                    }}
                  />

                  {/* Eje Y (valores) */}
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tick={{ fill: '#ffffffcc', fontSize: 12 }}
                    allowDecimals={false}
                  />

                  {/* Tooltip */}
                  <ChartTooltip
                    cursor={true}
                    content={
                      <ChartTooltipContent
                        contentStyle={{
                          backgroundColor: 'rgba(30,30,40,0.9)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#fff',
                        }}
                        labelStyle={{ color: '#fff' }}
                        labelFormatter={(value) => {
                          // value puede ser YYYY-MM-DD (clave) o ISO con TZ
                          const s = String(value)
                          const d = s.includes("T") ? parseISO(s) : dateFromYmdLocalMX(s)
                          return d.toLocaleDateString("es-MX", {
                            timeZone: MX_TZ,
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        }}
                        formatter={(val, name) => {
                          const n = Number(val)
                          if (name === "monto_total_descuento") {
                            return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n)
                          }
                          return new Intl.NumberFormat("es-MX").format(n)
                        }}
                        indicator="dot"
                      />
                    }
                  />

                  {/* Leyenda */}
                  <ChartLegend content={<ChartLegendContent />} />
                  <Legend wrapperStyle={{ color: '#ffffffcc' }} />

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
                <p className="text-sm text-white/70 mt-3">Sin datos de los últimos 7 días.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="glass border border-white/15 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Top 5: menos canjes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={barConfig}
                className="h-64 w-full"
                style={{ ["--color-canjes" as any]: "hsl(var(--chart-1))" } as React.CSSProperties}
              >
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
                    tick={{ fill: "rgba(255,255,255,.75)" }}
                    tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + "…" : v)}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,.75)" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="canjes" fill="var(--color-canjes)" radius={6}>
                    <LabelList dataKey="canjes" position="top" offset={8} className="fill-white text-xs" />
                  </Bar>
                </BarChart>
              </ChartContainer>
              {!loading && topMenosData.length === 0 && (
                <p className="text-sm text-white/70 mt-2">Sin datos.</p>
              )}
            </CardContent>
          </Card>

          {/* Próximamente */}
          <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
            <Card className="glass border border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-white/70">Próximamente</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/60">
                Tabla de canjes recientes / exportaciones / comparativas.
              </CardContent>
            </Card>
            <Card className="glass border border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-white/70">Próximamente</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/60">
                Desglose por sucursal o categoría.
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
