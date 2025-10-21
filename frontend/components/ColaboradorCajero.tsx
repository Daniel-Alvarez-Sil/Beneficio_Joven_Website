// /components/ColaboradorCajero.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getCajeros, type Cajero } from "@/actions/colaboradores/get-cajeros";
import { createCajero, type NewCajeroPayload } from "@/actions/colaboradores/create-cajeros"; // ✅ import correcto

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Loader2,
  UserCircle2,
  Mail,
  Phone,
  Copy,
  Plus,
  Search,
} from "lucide-react";

type Props = {
  colaboradorName: string;
  idNegocio?: string | number; // si lo envías, se agrega al payload del create
};

function fullName(c: Cajero) {
  return `${c.nombre} ${c.apellido_paterno ?? ""} ${c.apellido_materno ?? ""}`
    .replace(/\s+/g, " ")
    .trim();
}

export function ColaboradorCajero({ colaboradorName, idNegocio }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cajeros, setCajeros] = useState<Cajero[]>([]);
  const [q, setQ] = useState("");

  // ---- Estado del Dialog "Nuevo cajero" (igual patrón que Promociones) ----
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Campos del formulario
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidoP, setApellidoP] = useState("");
  const [apellidoM, setApellidoM] = useState("");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");

  // Cargar lista
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCajeros();
        if (!mounted) return;

        const uniq = new Map<number, Cajero>();
        (data ?? []).forEach((c) => uniq.set(c.id, c));
        const list = Array.from(uniq.values()).sort((a, b) =>
          fullName(a).localeCompare(fullName(b), "es")
        );
        setCajeros(list);
      } catch (e: any) {
        setError(e?.message ?? "Ocurrió un error al obtener cajeros");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [idNegocio]);

  const filtered = useMemo(() => {
    if (!q) return cajeros;
    const needle = q.toLowerCase();
    return cajeros.filter((c) => {
      const blob = `${fullName(c)} ${c.usuario} ${c.correo} ${c.telefono}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [cajeros, q]);

  // Validación simple
  const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const formInvalid =
    !nombre.trim() ||
    !apellidoP.trim() ||
    !usuario.trim() ||
    !isEmail(correo.trim()) || // 👈 importante: trim
    !contrasena.trim();

  // Submit crear cajero
  const handleCreateCajero = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formInvalid) {
      setError(
        "Revisa los campos: nombre, apellido paterno, usuario, correo válido y contraseña son obligatorios."
      );
      return;
    }

    const payload: NewCajeroPayload = {
      correo: correo.trim(),
      telefono: telefono.trim(),
      nombre: nombre.trim(),
      apellido_paterno: apellidoP.trim(),
      apellido_materno: apellidoM.trim(),
      usuario: usuario.trim(),
      contrasena: contrasena, // no se muestra en UI
      ...(idNegocio ? { id_negocio: Number(idNegocio) } : {}), // opcional
    };

    setCreating(true);
    try {
      await createCajero(payload);

      // Refetch
      const data = await getCajeros();
      const uniq = new Map<number, Cajero>();
      (data ?? []).forEach((c) => uniq.set(c.id, c));
      setCajeros(
        Array.from(uniq.values()).sort((a, b) =>
          fullName(a).localeCompare(fullName(b), "es")
        )
      );

      // Limpiar y cerrar
      setCorreo("");
      setTelefono("");
      setNombre("");
      setApellidoP("");
      setApellidoM("");
      setUsuario("");
      setContrasena("");
      setOpenCreate(false);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo crear el cajero. Intenta de nuevo.");
    } finally {
      setCreating(false);
    }
  };

  // Al abrir el diálogo, limpia estados
  const handleOpenChange = (open: boolean) => {
    setOpenCreate(open);
    if (open) {
      setError(null);
      setCorreo("");
      setTelefono("");
      setNombre("");
      setApellidoP("");
      setApellidoM("");
      setUsuario("");
      setContrasena("");
    }
  };

  return (
    <div className="min-h-screen relative text-white">
      {/* Fondo igual que Promociones */}
      <div className="auth-aurora" />
      <div className="auth-stars" />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Encabezado + acciones */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Cajeros</h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/70" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, usuario, correo…"
                className="pl-8 w-64 input-apple text-white placeholder-white/60 caret-white"
              />
            </div>

            {/* Botón + Dialog (mismo patrón visual que Promociones) */}
            <Dialog open={openCreate} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button className="gap-2 btn-gradient btn-apple text-white">
                  <Plus className="h-4 w-4" />
                  Nuevo cajero
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl glass-alt border border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle>Crear cajero</DialogTitle>
                  <DialogDescription>
                    Completa los datos del cajero. Los campos marcados como obligatorios deben estar completos.
                  </DialogDescription>
                </DialogHeader>

                {/* Banner de error (como en Promociones) */}
                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleCreateCajero} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ana"
                        required
                        className="input-apple text-white placeholder-white/60 caret-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Apellido paterno *</Label>
                      <Input
                        value={apellidoP}
                        onChange={(e) => setApellidoP(e.target.value)}
                        placeholder="Pérez"
                        required
                        className="input-apple text-white placeholder-white/60 caret-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Apellido materno</Label>
                      <Input
                        value={apellidoM}
                        onChange={(e) => setApellidoM(e.target.value)}
                        placeholder="García"
                        className="input-apple text-white placeholder-white/60 caret-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Usuario *</Label>
                      <Input
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        placeholder="anaperez"
                        required
                        className="input-apple text-white placeholder-white/60 caret-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Correo *</Label>
                      <Input
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="ana.perez@example.com"
                        required
                        className="input-apple text-white placeholder-white/60 caret-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+52 55 1234 5678"
                        className="input-apple text-white placeholder-white/60 caret-white"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label>Contraseña *</Label>
                      <Input
                        type="password"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        placeholder="MiPassw0rd!"
                        required
                        className="input-apple text-white placeholder-white/60 caret-white"
                      />
                      <p className="text-xs text-white/60">
                        La contraseña no se mostrará en el listado por seguridad.
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setOpenCreate(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating || formInvalid}
                      className="btn-gradient btn-apple text-white"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Crear cajero
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Error global fuera del dialog */}
        {error && !openCreate ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/80">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Cargando cajeros...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/70">
            {q
              ? "No hay cajeros que coincidan con tu búsqueda."
              : "No hay cajeros por mostrar."}
          </div>
        ) : (
          <section
            aria-label="Listado de cajeros"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((c) => {
              const name = fullName(c);
              return (
                <Card
                  key={c.id}
                  className="glass border border-white/15 hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <UserCircle2 className="w-4 h-4 text-white/80" />
                        </div>
                        <span className="line-clamp-1">{name}</span>
                      </CardTitle>
                      <Badge className="bg-white/20 text-white" variant="secondary">
                        @{c.usuario}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-white/60">Correo</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-white/70" />
                        <span className="truncate text-white/80">{c.correo}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-auto hover:bg-white/10"
                          onClick={() => navigator.clipboard?.writeText(c.correo)}
                          title="Copiar correo"
                        >
                          <Copy className="w-4 h-4 text-white/80" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-white/60">Teléfono</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-white/70" />
                        <span className="truncate text-white/80">{c.telefono}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-auto hover:bg-white/10"
                          onClick={() => navigator.clipboard?.writeText(c.telefono)}
                          title="Copiar teléfono"
                        >
                          <Copy className="w-4 h-4 text-white/80" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs pt-1 text-white/70">
                      <Badge
                        variant="outline"
                        className="bg-white/5 border-white/20 text-white/80"
                      >
                        Negocio #{c.id_negocio}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-white/5 border-white/20 text-white/80"
                      >
                        ID {c.id}
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
