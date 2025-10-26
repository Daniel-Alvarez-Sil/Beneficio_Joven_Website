// components/generals/promocion-behaviour.tsx

/**
 * Componente: PromocionesChart (wrapper conmutador)
 * Descripción: Selector que alterna entre dos implementaciones de gráfico (línea y área)
 *              para visualizar canjes por promoción durante los últimos 7 días.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Detalles:
 * - Recibe `canjesRaw` con forma: { "YYYY-MM-DD": { "Promo A": n, "Promo B": m, ... }, ... }.
 * - `mode` controla el tipo de gráfico mostrado: "line" o "area".
 * - `LineChartImpl` y `AreaChartImpl` convierten la estructura bruta a una lista por fecha
 *    y generan leyendas/colores estables por promoción.
 * - Se usan componentes de UI (shadcn/ui) y Recharts, con tooltips y leyendas personalizadas.
 *
 * Notas:
 * - No se altera la lógica funcional del componente original; solo se agrega documentación.
 */

"use client";

import * as React from "react";
import { useState } from "react";

// shadcn/ui
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// === Wrapper that toggles between your two original implementations ===
type CanjesRaw = Record<string, Record<string, number>>;
type Mode = "line" | "area";

export default function PromocionesChart({ canjesRaw }: { canjesRaw?: CanjesRaw }) {
  const [mode, setMode] = useState<Mode>("line");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <div className="min-w-[180px]">
          <Select value={mode} onValueChange={(v: Mode) => setMode(v)}>
            <SelectTrigger className="bg-white/10 text-white border-white/20">
              <SelectValue placeholder="Tipo de gráfico" />
            </SelectTrigger>
            <SelectContent className="glass-alt border-white/20 text-white">
              <SelectItem value="line">Línea</SelectItem>
              <SelectItem value="area">Área</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mode === "line" ? (
        <LineChartImpl canjesRaw={canjesRaw} />
      ) : (
        <AreaChartImpl canjesRaw={canjesRaw} />
      )}
    </div>
  );
}

/* ================== YOUR ORIGINAL AREA CHART (unchanged) ================== */

import {
  Card as ACard,
  CardContent as ACardContent,
  CardDescription as ACardDescription,
  CardHeader as ACardHeader,
  CardTitle as ACardTitle,
} from "@/components/ui/card";
import {
  ChartContainer as AChartContainer,
  ChartTooltip as AChartTooltip,
  ChartTooltipContent as AChartTooltipContent,
  type ChartConfig as AChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid as ACartesianGrid, XAxis as AXAxis } from "recharts";
import { Loader2 as ALoader2 } from "lucide-react";
import { toast as atoast } from "sonner";

function toVarToken(s: string) {
  const base = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleaned = base.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return cleaned.length ? cleaned : "key";
}

function AreaChartImpl({ canjesRaw }: { canjesRaw?: CanjesRaw }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(!canjesRaw);

  React.useEffect(() => {
    try {
      if (!canjesRaw || Object.keys(canjesRaw).length === 0) {
        setData([]);
        setLoading(false);
        return;
      }
      const days = Object.keys(canjesRaw).sort();
      const transformed = days.map((day) => ({ date: day, ...canjesRaw[day] }));
      setData(transformed);
    } catch (e) {
      console.error(e);
      atoast.error("Error al preparar datos de canjes");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [canjesRaw]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <ALoader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );

  if (data.length === 0)
    return (
      <ACard className="glass-alt text-white">
        <ACardHeader>
          <ACardTitle>Promociones – Últimos 7 días</ACardTitle>
          <ACardDescription>No hay datos disponibles.</ACardDescription>
        </ACardHeader>
      </ACard>
    );

  // collect ALL promo keys across rows (not just the first row)
  const promocionesSet = new Set<string>();
  for (const row of data) {
    Object.keys(row).forEach((k) => k !== "date" && promocionesSet.add(k));
  }
  const promociones = Array.from(promocionesSet);

  // stable mapping: original promo name + safe id + color
  const entries = promociones.map((promo, index) => {
    const id = `p${index}-${toVarToken(promo)}`;
    const color = `hsl(${(index * 50) % 360}, 70%, 50%)`;
    return { promo, id, color };
  });

  // config is only used for ChartContainer sizing; we won’t rely on its CSS vars
  const chartConfig: AChartConfig = entries.reduce((acc, { id, promo, color }) => {
    acc[id] = { label: promo, color };
    return acc;
  }, {} as AChartConfig);

  // simple custom legend that always shows proper promo names
  const Legend = () => (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
      {entries.map(({ id, promo, color }) => (
        <div key={id} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="text-white/90">{promo}</span>
        </div>
      ))}
    </div>
  );

  return (
    <ACard className="flex flex-col glass-alt text-white pt-0">
      <ACardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <AChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              {entries.map(({ id, color }) => (
                <linearGradient key={id} id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>

            <ACartesianGrid vertical={false} />
            <AXAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />

            <AChartTooltip
              cursor={false}
              content={
                <AChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("es-MX", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />

            {entries.map(({ promo, id, color }) => (
              <Area
                key={id}
                dataKey={promo}            // original field in your data
                type="natural"
                fill={`url(#fill-${id})`}  // gradient uses direct color
                stroke={color}             // line uses direct color
                stackId="a"
                name={promo}               // tooltip name (for completeness)
              />
            ))}
          </AreaChart>
        </AChartContainer>

        {/* Custom legend with correct labels */}
        <Legend />
      </ACardContent>
    </ACard>
  );
}

/* ================== YOUR ORIGINAL LINE CHART (unchanged) ================== */

import {
  Card as LCard,
  CardContent as LCardContent,
  CardDescription as LCardDescription,
  CardHeader as LCardHeader,
  CardTitle as LCardTitle,
} from "@/components/ui/card";
import {
  ChartContainer as LChartContainer,
  ChartTooltip as LChartTooltip,
  ChartTooltipContent as LChartTooltipContent,
  type ChartConfig as LChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";
import { Loader2 as LLoader2 } from "lucide-react";
import { toast as ltoast } from "sonner";

function toToken(s: string) {
  const base = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleaned = base.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return cleaned.length ? cleaned : "key";
}

function LineChartImpl({ canjesRaw }: { canjesRaw?: CanjesRaw }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(!canjesRaw);

  // Build days + full promo set first, then normalize rows
  const { days, promos } = React.useMemo(() => {
    const resultDays = canjesRaw ? Object.keys(canjesRaw).sort() : [];
    const set = new Set<string>();
    if (canjesRaw) {
      for (const d of resultDays) {
        Object.keys(canjesRaw[d] || {}).forEach((k) => set.add(k));
      }
    }
    return { days: resultDays, promos: Array.from(set) };
  }, [canjesRaw]);

  React.useEffect(() => {
    try {
      if (!canjesRaw || days.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }
      const normalized = days.map((day) => {
        const row: Record<string, number | string> = { date: day };
        for (const p of promos) {
          row[p] =
            canjesRaw[day] && typeof canjesRaw[day][p] === "number"
              ? canjesRaw[day][p]
              : 0;
        }
        return row;
      });
      setData(normalized);
    } catch (e) {
      console.error(e);
      ltoast.error("Error al preparar datos de canjes");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [canjesRaw, days, promos]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <LLoader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );

  if (data.length === 0)
    return (
      <LCard className="glass-alt text-white">
        <LCardHeader>
          <LCardTitle>Promociones – Últimos 7 días</LCardTitle>
          <LCardDescription>No hay datos disponibles.</LCardDescription>
        </LCardHeader>
      </LCard>
    );

  // stable mapping for legend & colors
  const entries = promos.map((promo, index) => {
    const id = `p${index}-${toToken(promo)}`;
    const color = `hsl(${(index * 50) % 360}, 70%, 50%)`;
    return { promo, id, color };
  });

  // chart config (for container sizing only; we won’t rely on CSS vars)
  const chartConfig: LChartConfig = entries.reduce((acc, { id, promo, color }) => {
    acc[id] = { label: promo, color };
    return acc;
  }, {} as LChartConfig);

  // custom legend so names/colors always match
  const Legend = () => (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
      {entries.map(({ id, promo, color }) => (
        <div key={id} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="text-white/90">{promo}</span>
        </div>
      ))}
    </div>
  );

  return (
    <LCard className="flex flex-col glass-alt text-white pt-0">
      <LCardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <LChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis allowDecimals={false} />
            <LChartTooltip
              cursor={{ strokeOpacity: 0.15 }}
              content={
                <LChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("es-MX", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  indicator="line"
                />
              }
            />

            {entries.map(({ promo, id, color }) => (
              <Line
                key={id}
                type="monotone"
                dataKey={promo}
                name={promo}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                // no stackId -> all lines share the same plane
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </LChartContainer>

        <Legend />
      </LCardContent>
    </LCard>
  );
}
