"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LogOut, Gift, Loader2 } from "lucide-react";
import { logout } from "@/actions/login/auth";
import { getPromociones, type Promocion } from "@/actions/colaboradores/get-promociones";

interface ColaboradorDashboardProps {
  onLogout: () => void;
  colaboradorName: string;
  idNegocio?: string;
}

function formatDateMX(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function PrecioBadge({ precio }: { precio: string }) {
  const v = Number(precio);
  if (!isFinite(v) || v <= 0) return null;
  return <Badge variant="secondary">${v.toFixed(2)} off</Badge>;
}

function PorcentajeBadge({ tipo, porcentaje }: { tipo: string | null; porcentaje: string }) {
  if (tipo !== "porcentaje") return null;
  const v = Number(porcentaje);
  if (!isFinite(v) || v <= 0) return null;
  return <Badge>-{v}%</Badge>;
}

export function ColaboradorDashboard({
  onLogout,
  colaboradorName,
  idNegocio = "3",
}: ColaboradorDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promos, setPromos] = useState<Promocion[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPromociones();
        if (mounted) setPromos(data);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Ocurrió un error al obtener promociones");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [idNegocio]);

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

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-lg font-medium mb-4">Promociones</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Cargando promociones...
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-600">{error}</div>
        ) : promos.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No hay promociones por mostrar.
          </div>
        ) : (
          <section
            aria-label="Listado de promociones"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {promos.map((p) => {
              const inicio = formatDateMX(p.fecha_inicio);
              const fin = formatDateMX(p.fecha_fin);

              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <CardTitle className="text-base">{p.nombre}</CardTitle>
                    <Badge variant={p.activo ? "default" : "secondary"}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {p.descripcion ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {p.descripcion}
                      </p>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-muted-foreground">Inicio</div>
                        <div className="font-medium">{inicio}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Fin</div>
                        <div className="font-medium">{fin}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <PorcentajeBadge tipo={p.tipo} porcentaje={p.porcentaje} />
                      <PrecioBadge precio={p.precio} />
                      <Badge variant="outline" className="gap-1">
                        <Gift className="w-3 h-3" />
                        {p.numero_canjeados} canjes
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
