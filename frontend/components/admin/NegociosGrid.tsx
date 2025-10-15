"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, Eye, Search } from "lucide-react";

interface NegocioResumen {
  id: number;
  nombre: string;
  estatus: string;
  administrador_negocio: null | { id: number; nombre: string; usuario: string; correo: string };
  num_promociones: number;
  avg_canje_por_promocion: number;
}

export function NegociosGrid() {
  const [negocios, setNegocios] = useState<NegocioResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  async function fetchNegocios() {
    try {
      setLoading(true);
      const res = await fetch("/api/negocios-resumen", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron obtener los negocios.");
      const data: NegocioResumen[] = await res.json();
      setNegocios(data);
    } catch (err: any) {
      toast.error("Error al cargar negocios", { description: err?.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNegocios(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return negocios;
    return negocios.filter((n) => {
      const admin = n.administrador_negocio;
      const haystack = [n.nombre, n.estatus, admin?.nombre, admin?.usuario, admin?.correo, String(n.num_promociones)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [q, negocios]);

  return (
    <Card className="glass-alt text-white">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <CardTitle className="text-white">Negocios</CardTitle>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, estatus o admin…"
            className="pl-8 input-apple text-white placeholder-white/70"
          />
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-sm text-white/70">Cargando negocios…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/70">No hay negocios para mostrar.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((n) => {
              const admin = n.administrador_negocio;
              const first = (n.nombre || "N").charAt(0).toUpperCase();
              const avg = Number(n.avg_canje_por_promocion ?? 0);
              return (
                <Card key={n.id} className="hover:shadow-md transition-shadow bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{first}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-white">{n.nombre}</h3>
                          <p className="text-xs text-white/70">
                            {admin ? `${admin.nombre} (${admin.usuario}) · ${admin.correo}` : "Sin administrador"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={n.estatus?.toLowerCase() === "activo" ? "default" : "secondary"}>
                        {n.estatus || "—"}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/80">Promociones:</span>
                        <span className="font-medium text-white">{n.num_promociones}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Avg canjes / promo:</span>
                        <span className="font-medium text-white">{avg.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-3 btn-apple btn-gradient text-white"
                      onClick={() => { /* navegar a detalle si aplica */ }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver detalles
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}