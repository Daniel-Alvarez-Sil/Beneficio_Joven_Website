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
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, AreaChart, Area, LabelList, Tooltip } from "recharts"
import { getEstadisticas, type EstadisticasResponse } from "@/actions/colaboradores/get-estadisticas"

// =========================
// Tipos
// =========================
interface ColaboradorDashboardProps {
  onLogout: () => void
  colaboradorName: string
  /** Pásame el id del negocio para pedir estadísticas/filtrar. */
  idNegocio?: string
}

export function ColaboradorDashboard({
  onLogout,
  colaboradorName,
  idNegocio = "3", // default para pruebas
}: ColaboradorDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<EstadisticasResponse | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getEstadisticas()
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
    return arr.map((p) => ({ titulo: p.titulo, canjes: Number(p.numero_de_canjes ?? 0) }))
  }, [stats])

  const topMenosData = useMemo(() => {
    const arr = stats?.["5_promociones_con_menos_canjes"] ?? []
    return arr.map((p) => ({ titulo: p.titulo, canjes: Number(p.numero_de_canjes ?? 0) }))
  }, [stats])

  /**
   * El API describe el histórico como un array cuyos elementos son objetos
   * del tipo { "fecha-hora": [titulo, monto_descuento] }.
   * Aquí agrupamos por fecha (YYYY-MM-DD) para graficar:
   *  - canjes (conteo de eventos)
   *  - monto_total_descuento (suma)
   */
  const historicoData = useMemo(() => {
    const src = stats?.historico_de_canjes_ultimos_siete_dias ?? []
    const byDate = new Map<string, { date: string; canjes: number; monto_total_descuento: number }>()

    for (const item of src) {
      // Cada item podría tener 1+ pares fecha-> [titulo, monto]
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
    canjes: {
      label: "Canjes",
      color: "hsl(var(--chart-1))",
    },
  }

  const areaConfig: ChartConfig = {
    canjes: { label: "Canjes", color: "hsl(var(--chart-1))" },
    monto_total_descuento: { label: "Monto total", color: "hsl(var(--chart-2))" },
  }

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
            <Button variant="outline" type="submit" className="gap-2" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>

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

        {/* Grid principal */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Total de canjes (Card) */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Total de canjes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-24 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="text-4xl font-bold tracking-tight">
                  {totalCanjes.toLocaleString("es-MX")}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Suma de canjes en todas las promociones.
              </p>
            </CardContent>
          </Card>

          {/* Top 5 con más canjes (BarChart) */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Top 5: Promociones con más canjes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={barConfig} className="h-64 w-full">
                <BarChart data={topMasData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="titulo" tickLine={false} axisLine={false} interval={0} angle={-10} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
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
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Histórico últimos 7 días (AreaChart) */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Histórico de canjes – últimos 7 días</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={areaConfig} className="h-64 w-full">
                <AreaChart data={historicoData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="canjes" stroke="var(--color-canjes)" fill="var(--color-canjes)" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="monto_total_descuento" stroke="var(--color-monto_total_descuento)" fill="var(--color-monto_total_descuento)" fillOpacity={0.15} />
                </AreaChart>
              </ChartContainer>
              {!loading && historicoData.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">Sin datos.</p>
              )}
            </CardContent>
          </Card>

          {/* Top 5 con menos canjes (BarChart) */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Top 5: Promociones con menos canjes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={barConfig} className="h-64 w-full">
                <BarChart data={topMenosData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="titulo" tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={80} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
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
        </div>
      </main>
    </div>
  )
}
