"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getNegocioDetalle } from "@/actions/administradores/get-negocio-detalle";
import { Loader2 } from "lucide-react";

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
        if (!response || !response.canjes_ultimos_7_dias) return;

        const raw = response.canjes_ultimos_7_dias;
        const days = Object.keys(raw).sort(); // chronological order
        const transformed = days.map((day) => ({
          date: day,
          ...raw[day],
        }));

        setData(transformed);
      } catch (error) {
        console.error("Error loading promociones:", error);
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

  // Extract all unique promocion names from the first object
  const promociones = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "date") : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Promociones – Últimos 7 días</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-sm">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {promociones.map((promo, index) => (
                <Bar key={promo} dataKey={promo} stackId="a" fill={`hsl(${(index * 60) % 360}, 70%, 50%)`} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
