"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Building2, Eye, Search, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogOverlay,
} from "@/components/ui/dialog";

interface NegocioResumen {
  id: number;
  nombre: string;
  estatus: string;
  administrador_negocio: null | {
    id: number;
    nombre: string;
    usuario: string;
    correo: string;
  };
  num_promociones: number;
  avg_canje_por_promocion: number;
  logo: string | null;
}

export function NegociosGrid() {
  const [negocios, setNegocios] = useState<NegocioResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  // Dialog state
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form local state (simple/uncontrolled hybrid using FormData on submit)
  const [file, setFile] = useState<File | null>(null);

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

  useEffect(() => {
    fetchNegocios();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return negocios;
    return negocios.filter((n) => {
      const admin = n.administrador_negocio;
      const haystack = [
        n.nombre,
        n.estatus,
        admin?.nombre,
        admin?.usuario,
        admin?.correo,
        String(n.num_promociones),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [q, negocios]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData();

    // --- Administrador (first) ---
    fd.append(
      "administrador.correo",
      (formEl.elements.namedItem("administrador.correo") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "administrador.telefono",
      (formEl.elements.namedItem("administrador.telefono") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "administrador.nombre",
      (formEl.elements.namedItem("administrador.nombre") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "administrador.apellido_paterno",
      (
        formEl.elements.namedItem(
          "administrador.apellido_paterno"
        ) as HTMLInputElement
      )?.value || ""
    );
    fd.append(
      "administrador.apellido_materno",
      (
        formEl.elements.namedItem(
          "administrador.apellido_materno"
        ) as HTMLInputElement
      )?.value || ""
    );
    fd.append(
      "administrador.usuario",
      (formEl.elements.namedItem("administrador.usuario") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "administrador.contrasena",
      (
        formEl.elements.namedItem(
          "administrador.contrasena"
        ) as HTMLInputElement
      )?.value || ""
    );

    // --- Negocio ---
    fd.append(
      "negocio.correo",
      (formEl.elements.namedItem("negocio.correo") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "negocio.telefono",
      (formEl.elements.namedItem("negocio.telefono") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "negocio.nombre",
      (formEl.elements.namedItem("negocio.nombre") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "negocio.rfc",
      (formEl.elements.namedItem("negocio.rfc") as HTMLInputElement)?.value ||
        ""
    );
    fd.append(
      "negocio.sitio_web",
      (formEl.elements.namedItem("negocio.sitio_web") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "negocio.estatus",
      (formEl.elements.namedItem("negocio.estatus") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "negocio.cp",
      (formEl.elements.namedItem("negocio.cp") as HTMLInputElement)?.value || ""
    );
    fd.append(
      "negocio.numero_ext",
      (formEl.elements.namedItem("negocio.numero_ext") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "negocio.numero_int",
      (formEl.elements.namedItem("negocio.numero_int") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "negocio.colonia",
      (formEl.elements.namedItem("negocio.colonia") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "negocio.municipio",
      (formEl.elements.namedItem("negocio.municipio") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "negocio.estado",
      (formEl.elements.namedItem("negocio.estado") as HTMLInputElement)
        ?.value || ""
    );
    fd.append(
      "negocio.url_maps",
      (formEl.elements.namedItem("negocio.url_maps") as HTMLInputElement)
        ?.value || ""
    );

    // Optional: if your backend expects 'file' as the image field (recommended by you)
    if (file) {
      fd.append("file", file, file.name);
    }
    // If someday you switch to negocio.logo instead, uncomment the next line and adjust backend:
    // if (file) fd.append("negocio.logo", file, file.name);

    // Boolean flags should be strings in multipart
    const creado = (
      formEl.elements.namedItem("creado_por_admin") as HTMLInputElement
    )?.checked
      ? "true"
      : "false";
    fd.append("creado_por_admin", creado);

    try {
      setSubmitting(true);
      const resp = await fetch("/api/create-colaborador", {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "No se pudo crear el colaborador.");
      }

      const { ok, message } = await resp.json();
      if (!ok) throw new Error(message || "No se pudo crear el colaborador.");

      toast.success("Colaborador creado correctamente");
      setOpen(false);
      formEl.reset();
      setFile(null);
      // Refresh data grid
      fetchNegocios();
    } catch (err: any) {
      toast.error("Error al crear colaborador", { description: err?.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="glass-alt text-white">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <CardTitle className="text-white">Negocios</CardTitle>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, estatus o admin…"
              className="pl-8 input-apple text-white placeholder-white/70"
            />
          </div>

          {/* NEW: Create colaborador button + dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            {/* Overlay & compact glassy dialog like your sample */}
            <DialogOverlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            <DialogTrigger asChild>
              <Button className="btn-apple btn-gradient text-white">
                <PlusCircle className="w-4 h-4 mr-1" />
                Nuevo colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl glass-alt text-white border-white/20 p-0">
              {/* Constrain height & make body scrollable */}
              <div className="max-h-[80vh] flex flex-col">
                <DialogHeader className="px-6 pt-5 pb-3 border-b border-white/10">
                  <DialogTitle className="text-white">
                    Crear colaborador
                  </DialogTitle>
                </DialogHeader>

                {/* Scrollable body */}
                <div className="px-6 py-4 overflow-y-auto">
                  <form
                    id="crearColaboradorForm"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* ADMINISTRADOR */}
                    <div>
                      <h3 className="text-base font-semibold">Administrador</h3>
                      <p className="text-sm text-white/70 mb-3">
                        Primero, ingresa los datos de la persona administradora.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="administrador.correo">Correo</Label>
                          <Input
                            id="administrador.correo"
                            name="administrador.correo"
                            type="email"
                            required
                            defaultValue="conimu@demo.com"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="administrador.telefono">
                            Teléfono
                          </Label>
                          <Input
                            id="administrador.telefono"
                            name="administrador.telefono"
                            required
                            defaultValue="55555555"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="administrador.nombre">Nombre</Label>
                          <Input
                            id="administrador.nombre"
                            name="administrador.nombre"
                            required
                            defaultValue="Ana"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="administrador.apellido_paterno">
                            Apellido paterno
                          </Label>
                          <Input
                            id="administrador.apellido_paterno"
                            name="administrador.apellido_paterno"
                            required
                            defaultValue="López"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="administrador.apellido_materno">
                            Apellido materno
                          </Label>
                          <Input
                            id="administrador.apellido_materno"
                            name="administrador.apellido_materno"
                            required
                            defaultValue="Ruiz"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="administrador.usuario">Usuario</Label>
                          <Input
                            id="administrador.usuario"
                            name="administrador.usuario"
                            required
                            defaultValue="conimux"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="administrador.contrasena">
                            Contraseña
                          </Label>
                          <Input
                            id="administrador.contrasena"
                            name="administrador.contrasena"
                            type="password"
                            required
                            defaultValue="secreta123"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* NEGOCIO */}
                    <div>
                      <h3 className="text-base font-semibold">Negocio</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="negocio.correo">Correo</Label>
                          <Input
                            id="negocio.correo"
                            name="negocio.correo"
                            type="email"
                            required
                            defaultValue="conimagen@demo.com"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.telefono">Teléfono</Label>
                          <Input
                            id="negocio.telefono"
                            name="negocio.telefono"
                            required
                            defaultValue="5551234567"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.nombre">Nombre</Label>
                          <Input
                            id="negocio.nombre"
                            name="negocio.nombre"
                            required
                            defaultValue="Mi Negocio SA de CV"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.rfc">RFC</Label>
                          <Input
                            id="negocio.rfc"
                            name="negocio.rfc"
                            required
                            defaultValue="XAXX010101000"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.sitio_web">Sitio web</Label>
                          <Input
                            id="negocio.sitio_web"
                            name="negocio.sitio_web"
                            defaultValue="https://www.ejemplo.com"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.estatus">Estatus</Label>
                          <Input
                            id="negocio.estatus"
                            name="negocio.estatus"
                            defaultValue="En revision"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.cp">CP</Label>
                          <Input
                            id="negocio.cp"
                            name="negocio.cp"
                            defaultValue="01000"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.numero_ext">
                            Número ext.
                          </Label>
                          <Input
                            id="negocio.numero_ext"
                            name="negocio.numero_ext"
                            defaultValue="5"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.numero_int">
                            Número int.
                          </Label>
                          <Input
                            id="negocio.numero_int"
                            name="negocio.numero_int"
                            defaultValue="5"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.colonia">Colonia</Label>
                          <Input
                            id="negocio.colonia"
                            name="negocio.colonia"
                            defaultValue="Centro"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.municipio">Municipio</Label>
                          <Input
                            id="negocio.municipio"
                            name="negocio.municipio"
                            defaultValue="CDMX"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="negocio.estado">Estado</Label>
                          <Input
                            id="negocio.estado"
                            name="negocio.estado"
                            defaultValue="CDMX"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="negocio.url_maps">URL de Maps</Label>
                          <Input
                            id="negocio.url_maps"
                            name="negocio.url_maps"
                            defaultValue="maps.com"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="file">Imagen (file)</Label>
                          <Input
                            id="file"
                            name="file"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setFile(e.target.files?.[0] ?? null)
                            }
                            className="bg-white/10 border-white/20 text-white file:text-white/90"
                          />
                          <p className="text-xs text-white/60 mt-1">
                            El archivo se envía como <code>file</code> en
                            multipart.
                          </p>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2">
                          <input
                            id="creado_por_admin"
                            name="creado_por_admin"
                            type="checkbox"
                            defaultChecked
                          />
                          <Label htmlFor="creado_por_admin">
                            Creado por admin
                          </Label>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Sticky footer */}
                <div className="px-6 pb-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      className="border-white/30 text-black/70"
                    >
                      Cerrar
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    form="crearColaboradorForm"
                    className="btn-apple btn-gradient"
                    disabled={submitting}
                  >
                    {submitting ? "Creando…" : "Crear colaborador"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-sm text-white/70">
            Cargando negocios…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/70">
            No hay negocios para mostrar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((n) => {
              const admin = n.administrador_negocio;
              const first = (n.nombre || "N").charAt(0).toUpperCase();
              const avg = Number(n.avg_canje_por_promocion ?? 0);
              return (
                <Card
                  key={n.id}
                  className="hover:shadow-md transition-shadow bg-white/5 border-white/10 rounded-xl overflow-hidden pt-0"
                >
                  {n.logo ? (
                    <div className="w-full h-36 bg-black/20 flex items-center justify-center">
                      <img
                        src={n.logo}
                        alt={n.nombre}
                        className="object-contain max-h-32 p-2 transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-r from-purple-700/40 to-blue-600/40 flex items-center justify-center text-white/60 text-sm italic">
                      Sin logo
                    </div>
                  )}

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="bg-white/10 text-white">
                          <AvatarFallback>{first}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-white truncate max-w-[180px]">
                            {n.nombre}
                          </h3>
                          <p className="text-xs text-white/70 truncate max-w-[200px]">
                            {admin
                              ? `${admin.nombre} (${admin.usuario}) · ${admin.correo}`
                              : "Sin administrador"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          n.estatus?.toLowerCase() === "activo"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {n.estatus || "—"}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/80">Promociones:</span>
                        <span className="font-medium text-white">
                          {n.num_promociones}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">
                          Avg canjes / promo:
                        </span>
                        <span className="font-medium text-white">
                          {avg.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-3 btn-apple btn-gradient text-white"
                      onClick={() => {
                        /* navegar a detalle si aplica */
                      }}
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
