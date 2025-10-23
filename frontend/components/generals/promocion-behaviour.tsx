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
        console.log("Negocio detalle obtenido:", response);

        const raw = response?.canjes_ultimos_7_dias;
        if (!raw || Object.keys(raw).length === 0) {
          console.warn("No hay datos de canjes en los últimos 7 días");
          setData([]);
          return;
        }

        // ✅ Transform to Recharts-compatible format
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
                <Bar
                  key={promo}
                  dataKey={promo}
                  fill={`hsl(${(index * 50) % 360}, 70%, 50%)`}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
