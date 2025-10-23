"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis } from "recharts";
import { getNegocioDetalle } from "@/actions/administradores/get-negocio-detalle";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PromocionesChartProps {
  id_negocio: number;
}

export default function PromocionesChart({ id_negocio }: PromocionesChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getNegocioDetalle(id_negocio);
        toast.success("Datos de negocio obtenidos");
        console.log("Negocio detalle obtenido:", response);

        const raw = response?.canjes_ultimos_7_dias;
        if (!raw || Object.keys(raw).length === 0) {
          console.warn("No hay datos de canjes en los últimos 7 días");
          setData([]);
          return;
        }

        // Transform to Recharts format
        const days = Object.keys(raw).sort();
        const transformed = days.map((day) => ({
          date: day,
          ...raw[day],
        }));

        setData(transformed);
      } catch (error) {
        console.error("Error loading promociones:", error);
        toast.error("Error al cargar datos del negocio");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id_negocio]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );

  if (data.length === 0)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Promociones – Últimos 7 días</CardTitle>
          <CardDescription>No hay datos disponibles.</CardDescription>
        </CardHeader>
      </Card>
    );

  // Extract dynamic promociones and define colors
  const promociones = Object.keys(data[0]).filter((key) => key !== "date");
  const chartConfig: ChartConfig = promociones.reduce((acc, promo, index) => {
    acc[promo] = {
      label: promo,
      color: `hsl(${(index * 50) % 360}, 70%, 50%)`,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className="flex flex-col glass-alt text-white pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Promociones – Últimos 7 días</CardTitle>
          <CardDescription>Comportamiento diario de canjes</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data}>
            <defs>
              {promociones.map((promo) => (
                <linearGradient
                  key={promo}
                  id={`fill-${promo}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${promo})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${promo})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
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

            {promociones.map((promo) => (
              <Area
                key={promo}
                dataKey={promo}
                type="natural"
                fill={`url(#fill-${promo})`}
                stroke={`var(--color-${promo})`}
                stackId="a"
              />
            ))}

            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
