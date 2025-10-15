"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Building2, Eye, RefreshCcw, Search } from "lucide-react";

type EstatusSolicitud = "PENDIENTE" | "APROBADA" | "RECHAZADA";

interface SolicitudItem {
  id: number;
  estatus: EstatusSolicitud | string;
  id_negocio: number;
  negocio: {
    id: number;
    nombre: string;
    correo: string;
    telefono: string;
    estatus: string;
  };
}

export function SolicitudesList() {
  const [data, setData] = useState<SolicitudItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"TODAS" | EstatusSolicitud>("TODAS");
  const [selected, setSelected] = useState<SolicitudItem | null>(null);
  const [open, setOpen] = useState(false);

  async function fetchSolicitudes() {
    try {
      setLoading(true);
      const res = await fetch("/api/solicitudes", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudieron obtener las solicitudes.");
      const payload: SolicitudItem[] = await res.json();
      setData(payload);
    } catch (err: any) {
      toast.error("Error al cargar solicitudes", { description: err?.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const filtered = useMemo(() => {
    let rows = data;
    if (status !== "TODAS") {
      rows = rows.filter((r) => (r.estatus || "").toUpperCase() === status);
    }
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const haystack = [
        r.negocio?.nombre,
        r.negocio?.correo,
        r.negocio?.telefono,
        r.estatus,
        String(r.id),
        String(r.negocio?.id),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [data, q, status]);

  function statusBadgeVariant(s?: string) {
    const v = (s || "").toUpperCase();
    if (v === "APROBADA") return "default" as const;
    if (v === "RECHAZADA") return "outline" as const;
    return "secondary" as const; // PENDIENTE / otros
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-500" />
          <div>
            <CardTitle>Solicitudes</CardTitle>
            <CardDescription>Revisión de solicitudes de negocio</CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por negocio, correo, teléfono…"
              className="pl-8"
            />
          </div>
          <Button variant="outline" onClick={fetchSolicitudes} disabled={loading}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refrescar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status filter */}
        <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
          <TabsList>
            <TabsTrigger value="TODAS">Todas</TabsTrigger>
            <TabsTrigger value="PENDIENTE">Pendiente</TabsTrigger>
            <TabsTrigger value="APROBADA">Aprobada</TabsTrigger>
            <TabsTrigger value="RECHAZADA">Rechazada</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Cargando solicitudes…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No hay solicitudes para mostrar.</div>
        ) : (
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => {
                  const first = (row.negocio?.nombre || "N").charAt(0).toUpperCase();
                  return (
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{row.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar><AvatarFallback>{first}</AvatarFallback></Avatar>
                          <div>
                            <div className="font-medium">{row.negocio?.nombre}</div>
                            <div className="text-xs text-muted-foreground">Negocio ID: {row.negocio?.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-0.5">
                          <div className="text-muted-foreground">{row.negocio?.correo}</div>
                          <div className="text-muted-foreground">{row.negocio?.telefono}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(row.estatus)}>{row.estatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelected(row);
                            setOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Detail dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de solicitud</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Solicitud ID</span>
                <span className="font-medium">{selected.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estatus</span>
                <span>
                  <Badge variant={statusBadgeVariant(selected.estatus)}>{selected.estatus}</Badge>
                </span>
              </div>
              <div className="h-px bg-muted my-2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground">Negocio</div>
                <div className="font-medium">{selected.negocio?.nombre}</div>
                <div className="text-muted-foreground">Negocio ID</div>
                <div className="font-medium">{selected.negocio?.id}</div>
                <div className="text-muted-foreground">Correo</div>
                <div className="font-medium">{selected.negocio?.correo}</div>
                <div className="text-muted-foreground">Teléfono</div>
                <div className="font-medium">{selected.negocio?.telefono}</div>
                <div className="text-muted-foreground">Estatus negocio</div>
                <div className="font-medium">{selected.negocio?.estatus}</div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
