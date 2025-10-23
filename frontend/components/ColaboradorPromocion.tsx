// components/ColaboradorPromocion.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./ui/select";

import {
  Calendar as CalendarIcon,
  Gift,
  Loader2,
  Plus,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

import { logout } from "@/actions/login/auth";
import {
  getPromociones,
  type Promocion,
} from "@/actions/colaboradores/get-promociones";
import { cambiarEstatusPromocion } from "@/actions/colaboradores/update-estatus-promocion";
import { deletePromocion } from "@/actions/colaboradores/delete-promocion";
import { createPromocion } from "@/actions/colaboradores/create-promocion";

interface ColaboradorDashboardProps {
  onLogout: () => void;
  colaboradorName: string;
  idNegocio?: string; // no lo mandaremos en el POST
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

function PorcentajeBadge({
  tipo,
  porcentaje,
}: {
  tipo: string | null;
  porcentaje: string;
}) {
  if (tipo !== "porcentaje") return null;
  const v = Number(porcentaje);
  if (!isFinite(v) || v <= 0) return null;
  return <Badge>-{v}%</Badge>;
}

function toUtcIsoFromDateAndTime(date: Date | null, timeHHMM: string): string | null {
  if (!date || !timeHHMM) return null;
  const [hhStr, mmStr] = timeHHMM.split(":");
  const hh = Number(hhStr ?? "0");
  const mm = Number(mmStr ?? "0");
  const d = new Date(date);
  d.setHours(hh, mm, 0, 63);
  return d.toISOString();
}

// ISO sin milisegundos: "2025-10-22T15:00:00.063Z" -> "2025-10-22T15:00:00Z"
function stripMs(iso: string) {
  return iso.replace(/\.\d{3}Z$/, "Z");
}

// Build 30-minute options "HH:MM"
const TIME_OPTIONS: string[] = Array.from({ length: 24 * 2 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

// === Tipo de promoción (solo UX/validación/prefijo) ===
const TIPO_OPCIONES = [
  { value: "porcentaje", label: "Descuento (%)" },
  { value: "precio", label: "Precio fijo (MXN)" },
  { value: "2x1", label: "2x1" },
  { value: "trae_un_amigo", label: "Trae un amigo" },
  { value: "otro", label: "Otra" },
] as const;
type TipoPromo = typeof TIPO_OPCIONES[number]["value"];
const TIPO_LABEL: Record<TipoPromo, string> = {
  porcentaje: "Descuento",
  precio: "Precio fijo",
  "2x1": "2x1",
  "trae_un_amigo": "Trae un amigo",
  otro: "Otra",
};

export function ColaboradorPromociones({
  colaboradorName,
  onLogout = logout,
  idNegocio = "3", // no se envía
}: ColaboradorDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Create form state
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const today = new Date();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [limitePorUsuario, setLimitePorUsuario] = useState<number | "">("");
  const [limiteTotal, setLimiteTotal] = useState<number | "">("");
  const [porcentaje, setPorcentaje] = useState<string>("0.00");
  const [precio, setPrecio] = useState<string>("0.00000");
  const [activo, setActivo] = useState<boolean>(true);

  const [fechaInicioDate, setFechaInicioDate] = useState<Date | null>(today);
  const [fechaFinDate, setFechaFinDate] = useState<Date | null>(today);
  const [horaInicio, setHoraInicio] = useState<string>("09:00");
  const [horaFin, setHoraFin] = useState<string>("21:00");

  // Tipo (UX)
  const [tipo, setTipo] = useState<TipoPromo>("porcentaje");

  // Imagen
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0);

  // Habilitación de numéricos según tipo
  const disablePrecio = tipo !== "precio";
  const disablePorcentaje = tipo !== "porcentaje";

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

  useEffect(() => {
    return () => {
      if (imagenPreview) URL.revokeObjectURL(imagenPreview);
    };
  }, [imagenPreview]);

  const handleToggleActivo = async (id: number) => {
    setError(null);
    setBusyId(id);
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p))
    );
    const ok = await cambiarEstatusPromocion(id);
    if (!ok) {
      setPromos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p))
      );
      setError("No se pudo cambiar el estatus. Intenta de nuevo.");
    }
    setBusyId(null);
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setDeletingId(id);
    const ok = await deletePromocion(id);
    if (ok) {
      setPromos((prev) => prev.filter((p) => p.id !== id));
    } else {
      setError("No se pudo borrar la promoción. Intenta de nuevo.");
    }
    setDeletingId(null);
  };

  // Exclusividad visual al teclear
  const onChangePorcentaje = (value: string) => {
    setPorcentaje(value);
    if (tipo === "porcentaje") setPrecio("0.00000");
  };
  const onChangePrecio = (value: string) => {
    setPrecio(value);
    if (tipo === "precio") setPorcentaje("0.00");
  };

  // Imagen: validación + preview
  const onSelectImagen: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImagenFile(null);
      setImagenPreview(null);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxMB = 5;
    if (!validTypes.includes(file.type)) {
      setError("La imagen debe ser JPG, PNG o WEBP.");
      e.currentTarget.value = "";
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      setError(`La imagen no debe exceder ${maxMB}MB.`);
      e.currentTarget.value = "";
      return;
    }

    setError(null);
    setImagenFile(file);
    const url = URL.createObjectURL(file);
    setImagenPreview(url);
  };

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setLimitePorUsuario("");
    setLimiteTotal("");
    setPorcentaje("0.00");
    setPrecio("0.00000");
    setActivo(true);
    setFechaInicioDate(today);
    setFechaFinDate(today);
    setHoraInicio("09:00");
    setHoraFin("21:00"); // <- corregido (quitado el `1`)
    setTipo("porcentaje");

    if (imagenPreview) URL.revokeObjectURL(imagenPreview);
    setImagenPreview(null);
    setImagenFile(null);

    setFileKey((k) => k + 1); // remount del <input type="file">
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    const fi = toUtcIsoFromDateAndTime(fechaInicioDate, horaInicio);
    const ff = toUtcIsoFromDateAndTime(fechaFinDate, horaFin);
    if (!fi || !ff) {
      setError("Selecciona fechas y horas válidas.");
      return;
    }
    if (new Date(fi) > new Date(ff)) {
      setError("La fecha/hora de inicio no puede ser posterior a la de fin.");
      return;
    }

    // Validaciones por tipo
    let pct = 0;
    let prc = 0;

    if (tipo === "porcentaje") {
      const v = Number(porcentaje || "0");
      if (!isFinite(v) || v <= 0) {
        setError("Ingresa un porcentaje válido (> 0).");
        return;
      }
      pct = Number(v.toFixed(2));
      prc = 0;
    } else if (tipo === "precio") {
      const v = Number(precio || "0");
      if (!isFinite(v) || v <= 0) {
        setError("Ingresa un precio válido (> 0).");
        return;
      }
      prc = Number(v.toFixed(5));
      pct = 0;
    } else {
      // 2x1 / trae_un_amigo / otro
      pct = 0;
      prc = 0;
    }

    // Formatos fijos
    const porcentajeStr = tipo === "porcentaje" ? pct.toFixed(2) : "0.00";
    const precioStr = tipo === "precio" ? prc.toFixed(5) : "0.00000";

    // Descripción final (prefijo para no numéricos)
    const descBase = (descripcion || "").trim();
    const esNoNumerico =
      tipo === "2x1" || tipo === "trae_un_amigo" || tipo === "otro";
    const descripcionFinal = esNoNumerico
      ? descBase
        ? `${TIPO_LABEL[tipo]}: ${descBase}`
        : `${TIPO_LABEL[tipo]}`
      : descBase;

    // Fechas sin ms
    const fiIso = stripMs(fi);
    const ffIso = stripMs(ff);

    // 🚫 Sin 'tipo' y 🚫 sin 'negocio' en el payload
    const fd = new FormData();
    fd.append("nombre", nombre.trim());
    fd.append("descripcion", descripcionFinal);
    fd.append("fecha_inicio", fiIso);
    fd.append("fecha_fin", ffIso);
    fd.append("limite_por_usuario", String(Number(limitePorUsuario || 0)));
    fd.append("limite_total", String(Number(limiteTotal || 0)));
    fd.append("porcentaje", porcentajeStr);
    fd.append("precio", precioStr);
    fd.append("activo", String(activo ? true : false)); // si tu API prefiere 1/0, cambia a String(activo ? 1 : 0)

    if (imagenFile) {
      fd.append("imagen", imagenFile); // si tu API exige 'file', cambia aquí el nombre de campo
    }

    setCreating(true);
    const ok = await createPromocion(fd);
    if (!ok) {
      setError("No se pudo crear la promoción. Revisa los campos e intenta de nuevo.");
      setCreating(false);
      return;
    }

    try {
      const data = await getPromociones();
      setPromos(data);
    } catch {
      // no-op
    }

    resetForm();
    setCreating(false);
    setOpenCreate(false);
  };

  return (
    <div className="min-h-screen relative text-white">
      <div className="auth-aurora" />
      <div className="auth-stars" />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Promociones</h2>

          {/* Create button + dialog */}
          <Dialog
            open={openCreate}
            onOpenChange={(v) => {
              if (!v) resetForm();
              setOpenCreate(v);
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 btn-gradient btn-apple text-white">
                <Plus className="h-4 w-4" />
                Nueva promoción
              </Button>
            </DialogTrigger>
            <DialogOverlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            <DialogContent className="max-w-2xl glass-alt border border-white/20 text-white max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle>Crear promoción</DialogTitle>
                  <DialogDescription>
                    Completa los campos, sube una imagen y selecciona fechas.
                  </DialogDescription>
                </DialogHeader>

                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Título (nombre)</Label>
                      <Input
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Viernes 2x1"
                        required
                        className="input-apple text-white placeholder-white/60 caret-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activo">Estatus</Label>
                      <div className="flex items-center gap-3 h-10 px-3 rounded-md border">
                        <Switch
                          id="activo"
                          checked={activo}
                          onCheckedChange={setActivo}
                        />
                        <span className="text-sm">
                          {activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>

                    {/* Tipo de promoción (UX) */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="tipo">Tipo de promoción</Label>
                      <Select value={tipo} onValueChange={(v: TipoPromo) => setTipo(v)}>
                        <SelectTrigger id="tipo" className="w-full bg-white/10 border-white/30 text-white">
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_OPCIONES.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Detalles de la promoción…"
                        rows={3}
                        className="input-apple text-white placeholder-white/60 caret-white"
                      />
                    </div>

                    {/* Calendarios + horas */}
                    <div className="space-y-2">
                      <Label>Fecha inicio</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start gap-2 bg-white/10 border-white/30 text-white hover:bg-white/15"
                          >
                            <CalendarIcon className="h-4 w-4" />
                            {fechaInicioDate
                              ? fechaInicioDate.toLocaleDateString("es-MX")
                              : "Selecciona fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Calendar
                            mode="single"
                            selected={fechaInicioDate ?? undefined}
                            onSelect={(d) => setFechaInicioDate(d ?? null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="space-y-1">
                        <Label className="text-xs">Hora inicio</Label>
                        <Select value={horaInicio} onValueChange={setHoraInicio}>
                          <SelectTrigger className="w-full bg-white/10 border-white/30 text-white">
                            <SelectValue placeholder="Selecciona hora" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start gap-2 bg-white/10 border-white/30 text-white hover:bg-white/15"
                          >
                            <CalendarIcon className="h-4 w-4" />
                            {fechaFinDate
                              ? fechaFinDate.toLocaleDateString("es-MX")
                              : "Selecciona fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Calendar
                            mode="single"
                            selected={fechaFinDate ?? undefined}
                            onSelect={(d) => setFechaFinDate(d ?? null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <div className="space-y-1">
                        <Label className="text-xs">Hora fin</Label>
                        <Select value={horaFin} onValueChange={setHoraFin}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona hora" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Límites y descuentos */}
                    <div className="space-y-2">
                      <Label htmlFor="limite_por_usuario">Límite por usuario</Label>
                      <Input
                        id="limite_por_usuario"
                        type="number"
                        min={0}
                        value={limitePorUsuario}
                        onChange={(e) =>
                          setLimitePorUsuario(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        placeholder="Ej. 10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="limite_total">Límite total</Label>
                      <Input
                        id="limite_total"
                        type="number"
                        min={0}
                        value={limiteTotal}
                        onChange={(e) =>
                          setLimiteTotal(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        placeholder="Ej. 100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="porcentaje">Descuento (%)</Label>
                      <Input
                        id="porcentaje"
                        type="number"
                        step="0.01"
                        value={porcentaje}
                        onChange={(e) => onChangePorcentaje(e.target.value)}
                        placeholder="0.00"
                        disabled={disablePorcentaje}
                        required={tipo === "porcentaje"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="precio">Precio fijo (MXN)</Label>
                      <Input
                        id="precio"
                        type="number"
                        step="0.00001"
                        value={precio}
                        onChange={(e) => onChangePrecio(e.target.value)}
                        placeholder="100.00000"
                        disabled={disablePrecio}
                        required={tipo === "precio"}
                      />
                    </div>

                    {/* Imagen */}
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="imagen" className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Imagen de la promoción (JPG/PNG/WEBP, máx 5MB)
                      </Label>
                      <Input
                        key={fileKey}
                        id="imagen"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={onSelectImagen}
                      />
                      {imagenPreview ? (
                        <div className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 p-2">
                          <img
                            src={imagenPreview}
                            alt="Vista previa de la promoción"
                            className="w-full max-h-64 md:max-h-72 object-contain rounded-lg"
                          />
                          <p className="mt-2 text-xs text-white/60">
                            La imagen se ajusta a la vista. Se guardará con su tamaño original.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        resetForm();
                        setOpenCreate(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="btn-gradient btn-apple text-white"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Crear promoción
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && !openCreate ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Cargando promociones...
          </div>
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
              const isBusy = busyId === p.id || deletingId === p.id;

              const imgUrl = p.imagen && p.imagen.trim() !== "" ? p.imagen : null;

              return (
                <Card
                  key={p.id}
                  className="glass border border-white/15 hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[120px,1fr] gap-4">
                    {/* Columna imagen */}
                    {imgUrl ? (
                      <div className="relative w-full h-40 md:h-[120px]">
                        <img
                          src={imgUrl}
                          alt={p.nombre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="hidden md:block w-full h-[120px] bg-white/5" />
                    )}

                    {/* Columna contenido */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base text-white">
                            {p.nombre}
                          </CardTitle>
                          <Badge
                            variant={p.activo ? "default" : "secondary"}
                            className={
                              p.activo
                                ? "bg-white/20 text-white"
                                : "bg-white/10 text-white/80"
                            }
                          >
                            {p.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/60 select-none">
                            Estatus
                          </span>
                          <Switch
                            checked={p.activo}
                            onCheckedChange={() => handleToggleActivo(p.id)}
                            disabled={isBusy}
                            aria-label={`Cambiar estatus de ${p.nombre}`}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-red-50/10"
                                aria-label={`Borrar promoción ${p.nombre}`}
                                title="Borrar promoción"
                                disabled={isBusy}
                              >
                                {deletingId === p.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass-alt">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white/80">
                                  ¿Borrar “{p.nombre}”?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará la promoción de forma permanente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDelete(p.id)}
                                >
                                  Borrar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {p.descripcion ? (
                        <p className="mt-2 text-sm text-white/70 line-clamp-3">
                          {p.descripcion}
                        </p>
                      ) : null}

                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-white/70">Inicio</div>
                          <div className="font-medium text-white/70">{inicio}</div>
                        </div>
                        <div>
                          <div className="text-white/70">Fin</div>
                          <div className="font-medium text-white/70">{fin}</div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PorcentajeBadge tipo={p.tipo} porcentaje={p.porcentaje} />
                        <PrecioBadge precio={p.precio} />
                        <Badge variant="outline" className="gap-1 text-white/70">
                          <Gift className="w-3 h-3 text-white/70" />
                          {p.numero_canjeados} canjes
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
