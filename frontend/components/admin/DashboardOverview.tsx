"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Label } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import PromocionesChart from "@/components/generals/promocion-behaviour";

interface HeaderStats {
  promociones_por_negocio_ultimo_mes: Record<string, number>;
  canjes_por_negocio_ultimo_mes: Record<string, number>;
  promociones_activas_por_negocio: Record<string, number>;
  total_colaboradores: number;
}

const COLOR_VARS = Array.from({ length: 12 }, (_, i) => `var(--chart-${i + 1})`);
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

type DonutDatum = { name: string; value: number; fill: string; slug: string };

function objectToDonutData(obj?: Record<string, number>): DonutDatum[] {
  if (!obj) return [];
  return Object.entries(obj).map(([name, value], i) => {
    const slug = slugify(name || `item-${i}`);
    return { name, value: Number(value) || 0, slug, fill: `var(--color-${slug})` };
  });
}
function buildChartConfig(data: DonutDatum[]): ChartConfig {
  const cfg: ChartConfig = { value: { label: "Total" } } as ChartConfig;
  data.forEach((d, i) => ((cfg as any)[d.slug] = { label: d.name, color: COLOR_VARS[i % COLOR_VARS.length] }));
  return cfg;
}

function SimpleStatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="glass-alt text-white flex flex-col justify-between">
      {/* Header arriba como las otras cards */}
      <div className="p-4 flex items-center gap-2">
        {icon}
        <CardTitle className="text-base font-semibold text-white">
          {title}
        </CardTitle>
      </div>

      {/* Valor centrado visualmente */}
      <div className="flex-1 flex items-center justify-center pb-4">
        <p className="text-6xl md:text-7xl font-extrabold leading-none tracking-tight text-center">
          {value}
        </p>
      </div>
    </Card>
  );
}

function DonutCard({ title, subtitle, dataObj, centerLabel = "Total" }: {
  title: string;
  subtitle?: string;
  dataObj?: Record<string, number>;
  centerLabel?: string;
}) {
  const data = useMemo(() => objectToDonutData(dataObj), [dataObj]);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const config = useMemo(() => buildChartConfig(data), [data]);

  return (
    <Card className="flex flex-col glass-alt text-white">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-white">{title}</CardTitle>
        {subtitle ? <CardDescription className="text-white/70">{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex-1 pb-0 chart-dark">
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const cx = viewBox.cx as number;
                    const cy = viewBox.cy as number;
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy} className="fill-white text-3xl font-bold">
                          {total.toLocaleString("es-MX")}
                        </tspan>
                        <tspan x={cx} y={cy + 24} className="fill-white/70">
                          {centerLabel}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm text-white/80">
        <div className="flex items-center gap-2 leading-none font-medium">
          Distribución por negocio <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function DashboardOverview() {
  const [headerStats, setHeaderStats] = useState<HeaderStats | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchHeader() {
    try {
      setLoading(true);
      const res = await fetch("/api/estadisticas-header", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron obtener las estadísticas de cabecera.");
      const data: HeaderStats = await res.json();
      setHeaderStats(data);
    } catch (err: any) {
      toast.error("Error al cargar estadísticas", { description: err?.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchHeader(); }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <SimpleStatCard
        title="Total Colaboradores"
        value={loading ? "—" : headerStats?.total_colaboradores ?? 0}
        icon={<Users className="w-5 h-5" />}
      />
      <DonutCard
        title="Promociones (último mes)"
        subtitle="Por negocio"
        dataObj={headerStats?.promociones_por_negocio_ultimo_mes}
        centerLabel="Total"
      />
      <DonutCard
        title="Canjes (último mes)"
        subtitle="Por negocio"
        dataObj={headerStats?.canjes_por_negocio_ultimo_mes}
        centerLabel="Total"
      />
      <DonutCard
        title="Promociones activas"
        subtitle="Por negocio"
        dataObj={headerStats?.promociones_activas_por_negocio}
        centerLabel="Total"
      />
      {/* <PromocionesChart id_negocio={4} /> */}
    </div>
  );
}