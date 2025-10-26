// components/admin/SolicitudesList.tsx
"use client";

/**
 * Componente: SolicitudesList
 * Descripción: Listado de solicitudes de negocio con búsqueda, filtrado por estatus,
 *              refresco manual y revisión (aprobar/rechazar) dentro de un diálogo.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo principal:
 * 1) `fetchSolicitudes()` consulta `/api/solicitudes` y carga el arreglo base.
 * 2) `filtered` aplica filtros por texto (`q`) y por estatus (tabs).
 * 3) `openVer(row)` abre el diálogo de detalle y resetea el estado de revisión.
 * 4) `handleSubmitReview()` valida selección (aprobado/rechazado), compone el payload
 *    y llama `reviewSolicitud`. Actualiza la fila en memoria y muestra toasts.
 *
 * Notas:
 * - La revisión sólo se permite si la solicitud está en estatus "PENDIENTE".
 * - El diálogo de "Ver" contiene los controles de revisión — no hay botón separado.
 * - Se utilizan componentes UI (Card, Table, Tabs, Dialog, etc.) y `sonner` para toasts.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Eye, RefreshCcw, Search, Check, X } from "lucide-react";

// ⬇️ Adjust this path to your file that exports reviewSolicitud
import { reviewSolicitud } from "@/actions/administradores/review-solicitud";

type EstatusSolicitud = "pendiente" | "aprobado" | "rechazado";
interface SolicitudItem {
  id: number;
  estatus: EstatusSolicitud | string;
  id_negocio: number;
  negocio: { id: number; nombre: string; correo: string; telefono: string; estatus: string };
}

export function SolicitudesList() {
  const [data, setData] = useState<SolicitudItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"TODAS" | EstatusSolicitud>("TODAS");

  // Single dialog (Ver + Revisar dentro)
  const [selected, setSelected] = useState<SolicitudItem | null>(null);
  const [open, setOpen] = useState(false);

  // Review state inside "Ver"
  const [decision, setDecision] = useState<"" | "APROBADA" | "RECHAZADA">("");
  const [observacion, setObservacion] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
  useEffect(() => { fetchSolicitudes(); }, []);

  const filtered = useMemo(() => {
    let rows = data;
    if (status !== "TODAS") {
      rows = rows.filter((r) => (r.estatus || "").toUpperCase() === status.toUpperCase());
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
    if (v === "APROBADO") return "default" as const;
    if (v === "RECHAZADO") return "outline" as const;
    return "secondary" as const; // PENDIENTE / otros
  }

  function statusBadgeVariant2(s?: string) {
    const v = (s || "").toUpperCase();
    if (v === "APROBADO") return "secondary" as const;
    if (v === "RECHAZADO") return "outline" as const;
    return "default" as const; // PENDIENTE / otros
  }
  // ...inside your component, keep everything else the same

function openVer(row: SolicitudItem) {
  setSelected(row);
  setDecision("");
  setObservacion("");
  setOpen(true);
}

async function handleSubmitReview() {
  if (!selected) return;

  // ⛔ Extra safety: block submission if not pending
  const isPendiente =
    String(selected.estatus || "").toUpperCase() === "PENDIENTE";
  if (!isPendiente) {
    toast.message("Sin cambios", {
      description: "La solicitud ya no está pendiente.",
    });
    return;
  }

  if (decision === "") {
    toast.error("Selecciona una acción", { description: "Aprobar o rechazar la solicitud." });
    return;
  }
  if (decision === "RECHAZADA" && !observacion.trim()) {
    toast.error("Observaciones requeridas", { description: "Indica el motivo del rechazo." });
    return;
  }

  try {
    setSubmitting(true);
    const estatusToSend = decision === "aprobado" ? "aprobada" : "rechazada";

    const ok = await reviewSolicitud({
      id_solicitud: selected.id,
      estatus: estatusToSend,
      observaciones: decision === "RECHAZADA" ? observacion.trim() : "",
    });

    if (!ok) throw new Error("No se pudo registrar la revisión.");

    setData((prev) =>
      prev.map((r) => (r.id === selected.id ? { ...r, estatus: decision } : r))
    );

    toast.success(
      decision === "APROBADA" ? "Solicitud aprobada" : "Solicitud rechazada",
      { description: `ID ${selected.id} • ${selected.negocio?.nombre}` }
    );

    setOpen(false);
    setSelected(null);
  } catch (err: any) {
    toast.error("Error al revisar solicitud", { description: err?.message ?? "Intenta nuevamente." });
  } finally {
    setSubmitting(false);
  }
}


  return (
    <Card className="glass-alt text-white">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <div>
            <CardTitle className="text-white">Solicitudes</CardTitle>
            <CardDescription className="text-white/70">Revisión de solicitudes de negocio</CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por negocio, correo, teléfono…"
              className="pl-8 input-apple text-white placeholder-white/70"
            />
          </div>
          <Button variant="outline" onClick={fetchSolicitudes} disabled={loading} className="btn-apple text-white border-white/30">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refrescar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
          <TabsList className="glass bg-white/10 border-white/20">
            <TabsTrigger value="TODAS" className="text-white data-[state=active]:bg-white/15">Todas</TabsTrigger>
            <TabsTrigger value="PENDIENTE" className="text-white data-[state=active]:bg-white/15">Pendiente</TabsTrigger>
            <TabsTrigger value="APROBADO" className="text-white data-[state=active]:bg-white/15">Aprobada</TabsTrigger>
            <TabsTrigger value="RECHAZADO" className="text-white data-[state=active]:bg-white/15">Rechazada</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="py-12 text-center text-sm text-white/70">Cargando solicitudes…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/70">No hay solicitudes para mostrar.</div>
        ) : (
          <div className="rounded-md border border-white/10 bg-white/5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white/70">ID</TableHead>
                  <TableHead className="text-white/70">Negocio</TableHead>
                  <TableHead className="text-white/70">Contacto</TableHead>
                  <TableHead className="text-white/70">Estatus</TableHead>
                  <TableHead className="text-right text-white/70">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => {
                  const first = (row.negocio?.nombre || "N").charAt(0).toUpperCase();
                  return (
                    <TableRow key={row.id} className="hover:bg-white/5">
                      <TableCell className="font-medium text-white">{row.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar><AvatarFallback>{first}</AvatarFallback></Avatar>
                          <div>
                            <div className="font-medium text-white">{row.negocio?.nombre}</div>
                            <div className="text-xs text-white/60">Negocio ID: {row.negocio?.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-0.5">
                          <div className="text-white/80">{row.negocio?.correo}</div>
                          <div className="text-white/80">{row.negocio?.telefono}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(row.estatus)}>{row.estatus.toLowerCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-white border-white/30"
                          onClick={() => openVer(row)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                        {/* ⬆️ Only "Ver" remains; review happens inside the dialog */}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* "Ver" dialog now includes the review controls */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-md glass-alt text-white border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Detalle de solicitud</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">
              {/* Datos */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">Solicitud ID</span>
                  <span className="font-medium text-white">{selected.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Estatus actual</span>
                  <span>
                    <Badge variant={statusBadgeVariant2(selected.estatus)} className={selected.estatus !== "aprobado" ? "text-white" : "text-black"}>{selected.estatus.toLowerCase()}</Badge>
                  </span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-white/70">Negocio</div>
                  <div className="font-medium text-white">{selected.negocio?.nombre}</div>
                  <div className="text-white/70">Negocio ID</div>
                  <div className="font-medium text-white">{selected.negocio?.id}</div>
                  <div className="text-white/70">Correo</div>
                  <div className="font-medium text-white">{selected.negocio?.correo}</div>
                  <div className="text-white/70">Teléfono</div>
                  <div className="font-medium text-white">{selected.negocio?.telefono}</div>
                  <div className="text-white/70">Estatus negocio</div>
                  <div className="font-medium text-white">{selected.negocio?.estatus}</div>
                </div>
              </div>
              {/* Revisión */}
              <div className="h-px bg-white/10" />

              {(() => {
                const isPendiente =
                  String(selected?.estatus || "").toUpperCase() === "PENDIENTE";

                if (!isPendiente) {
                  // 🚫 Not pending: hide controls, show a helpful note
                  return (
                    <div className="text-sm text-white/70">
                      Esta solicitud ya fue revisada con estatus de <span className="font-medium text-white">{String(selected?.estatus)}</span>.
                    </div>
                  );
                }

                // ✅ Pending: show approve/reject controls
                return (
                  <div className="space-y-3">
                    <Label className="text-white">Revisar solicitud</Label>

                    <RadioGroup
                      value={decision}
                      onValueChange={(v) => setDecision(v as any)}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2 rounded-lg border border-white/20 px-3 py-2">
                        <RadioGroupItem
                          value="aprobado"
                          id="r-ap"
                          className="border-white/40 text-white/60 data-[state=checked]:text-white data-[state=checked]:border-white"
                        />
                        <Label htmlFor="r-ap" className="flex items-center gap-1 cursor-pointer">
                          <Check className="w-4 h-4" /> Aprobar
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border border-white/20 px-3 py-2">
                        <RadioGroupItem
                          value="rechazado"
                          id="r-re"
                          className="border-white/40 text-white/60 data-[state=checked]:text-white data-[state=checked]:border-white"
                        />
                        <Label htmlFor="r-re" className="flex items-center gap-1 cursor-pointer">
                          <X className="w-4 h-4" /> Rechazar
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="space-y-2">
                      <Label className={`text-white ${decision === "RECHAZADA" ? "" : "opacity-60"}`}>
                        Observaciones {decision === "RECHAZADA" ? "(requerido)" : "(opcional)"}
                      </Label>
                      <Textarea
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        placeholder="Escribe el motivo del rechazo…"
                        disabled={decision !== "RECHAZADA"}
                        className="min-h-[96px] bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="border-white/30 text-black/70"
                        onClick={() => setOpen(false)}
                        disabled={submitting}
                      >
                        Cerrar
                      </Button>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={
                          submitting ||
                          decision === "" ||
                          (decision === "RECHAZADA" && !observacion.trim())
                        }
                      >
                        {submitting ? "Guardando…" : "Guardar"}
                      </Button>
                    </div>
                  </div>
                );
              })()}

             
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
