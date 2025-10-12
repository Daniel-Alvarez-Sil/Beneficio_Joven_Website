"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { toast } from "sonner"; // ⬅️ Sonner
import {
  Users,
  Star,
  Gift,
  TrendingUp,
  Eye,
  LogOut,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Building2,
  UserCircle2,
} from "lucide-react";

// =========================
// Tipos
// =========================
interface AdminDashboardProps {
  onLogout: () => void;
}

type EstatusSolicitud = "En revision" | "Aprobada" | "Rechazada";

interface SolicitudNegocio {
  id: number;
  estatus: EstatusSolicitud;
  administrador: {
    correo: string;
    telefono: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    usuario: string;
  };
  negocio: {
    correo: string;
    telefono: string;
    nombre: string;
    rfc: string;
    sitio_web?: string;
    razon_social?: string;
    cp: string;
    numero_ext?: string;
    numero_int?: string;
    colonia?: string;
    calle?: string;
    municipio?: string;
    estado?: string;
  };
  fecha_creacion: string;
}

interface AccionRespuesta {
  ok: boolean;
  message?: string;
}

// =========================
// Mock para colaboradores/estadísticas
// =========================
const colaboradores = [
  { id: 1, name: "María García", company: "TechCorp", rating: 4.8, cupones: 12, activo: true },
  { id: 2, name: "Carlos López", company: "InnovaSoft", rating: 4.6, cupones: 8, activo: true },
  { id: 3, name: "Ana Rodríguez", company: "DigitalMax", rating: 4.9, cupones: 15, activo: false },
  { id: 4, name: "Luis Martín", company: "WebFlow", rating: 4.7, cupones: 10, activo: true },
  { id: 5, name: "Sofia Chen", company: "DataVision", rating: 4.5, cupones: 6, activo: true },
  { id: 6, name: "Diego Ruiz", company: "CloudTech", rating: 4.8, cupones: 9, activo: true },
];

const estadisticas = {
  totalColaboradores: 24,
  colaboradoresActivos: 18,
  cuponesSubidos: 156,
  cuponesCanjeados: 89,
};

// =========================
// Helpers
// =========================
function fmtFecha(fechaISO?: string) {
  if (!fechaISO) return "-";
  const d = new Date(fechaISO);
  return d.toLocaleString();
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {

  const [selectedColaborador, setSelectedColaborador] =
    useState<(typeof colaboradores)[0] | null>(null);

  const [activeTab, setActiveTab] = useState<"home" | "info" | "stats" | "solicitudes">("home");

  // =========================
  // Estado de Solicitudes
  // =========================
  const [solicitudes, setSolicitudes] = useState<SolicitudNegocio[]>([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EstatusSolicitud | "Todas">("En revision");

  // Modal detalle solicitud
  const [openDetalle, setOpenDetalle] = useState(false);
  const [detalle, setDetalle] = useState<SolicitudNegocio | null>(null);

  // Modal rechazar
  const [openRechazar, setOpenRechazar] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [accionLoading, setAccionLoading] = useState(false);

  // =========================
  // Fetch lista de solicitudes
  // =========================
  async function fetchSolicitudes() {
    try {
      setLoadingSolicitudes(true);
      const url =
        statusFilter === "Todas"
          ? `/admin/solicitudes`
          : `/admin/solicitudes?estatus=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar solicitudes");
      const data: SolicitudNegocio[] = await res.json();
      setSolicitudes(data);
    } catch (err: any) {
      toast.error("Error al cargar solicitudes", {
        description: err?.message ?? "No se pudieron obtener las solicitudes.",
      });
    } finally {
      setLoadingSolicitudes(false);
    }
  }

  useEffect(() => {
    fetchSolicitudes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // =========================
  // Ver detalle
  // =========================
  async function verDetalle(id: number) {
    try {
      setAccionLoading(true);
      const res = await fetch(`/admin/solicitudes/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar el detalle.");
      const data: SolicitudNegocio = await res.json();
      setDetalle(data);
      setOpenDetalle(true);
    } catch (err: any) {
      toast.error("No se pudo abrir la solicitud", {
        description: err?.message,
      });
    } finally {
      setAccionLoading(false);
    }
  }

  // =========================
  // Aprobar
  // =========================
  async function aprobarSolicitud(id: number) {
    try {
      setAccionLoading(true);
      const res = await fetch(`/admin/solicitudes/${id}/aprobar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data: AccionRespuesta = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "No se pudo aprobar la solicitud");
      }

      toast.success("Solicitud aprobada", {
        description: "Se creó el negocio y el administrador correspondiente.",
      });

      setOpenDetalle(false);
      setDetalle(null);
      await fetchSolicitudes();
    } catch (err: any) {
      toast.error("No se pudo aprobar", {
        description: err?.message,
      });
    } finally {
      setAccionLoading(false);
    }
  }

  // =========================
  // Rechazar
  // =========================
  async function rechazarSolicitud(id: number, motivo: string) {
    try {
      if (!motivo.trim()) {
        toast.warning("Falta motivo de rechazo", {
          description: "Por favor, escribe el motivo de rechazo.",
        });
        return;
      }
      setAccionLoading(true);
      const res = await fetch(`/admin/solicitudes/${id}/rechazar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      });
      const data: AccionRespuesta = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "No se pudo rechazar la solicitud");
      }

      toast.success("Solicitud rechazada", {
        description: "Se notificó al solicitante con el motivo.",
      });

      setOpenRechazar(false);
      setMotivoRechazo("");
      setOpenDetalle(false);
      setDetalle(null);
      await fetchSolicitudes();
    } catch (err: any) {
      toast.error("No se pudo rechazar", {
        description: err?.message,
      });
    } finally {
      setAccionLoading(false);
    }
  }

  // =========================
  // Filtro local
  // =========================
  const solicitudesFiltradas = useMemo(() => {
    if (!query.trim()) return solicitudes;
    const q = query.toLowerCase();
    return solicitudes.filter((s) => {
      const campos = [
        s.negocio?.nombre,
        s.negocio?.rfc,
        s.negocio?.correo,
        s.administrador?.nombre,
        s.administrador?.usuario,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return campos.includes(q);
    });
  }, [solicitudes, query]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-10 h-10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <h1 className="text-xl font-bold">Dashboard Administradores</h1>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home">Inicio</TabsTrigger>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          </TabsList>

          {/* ======= HOME ======= */}
          <TabsContent value="home" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Total Colaboradores</p>
                      <p className="text-2xl font-bold">{estadisticas.totalColaboradores}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Activos</p>
                      <p className="text-2xl font-bold">{estadisticas.colaboradoresActivos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">Cupones Subidos</p>
                      <p className="text-2xl font-bold">{estadisticas.cuponesSubidos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-600">Canjeados</p>
                      <p className="text-2xl font-bold">{estadisticas.cuponesCanjeados}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Colaboradores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {colaboradores.map((colaborador) => (
                    <Card key={colaborador.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{colaborador.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{colaborador.name}</h3>
                              <p className="text-sm text-gray-600">{colaborador.company}</p>
                            </div>
                          </div>
                          <Badge variant={colaborador.activo ? "default" : "secondary"}>
                            {colaborador.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Rating:</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {colaborador.rating}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Cupones:</span>
                            <span>{colaborador.cupones}</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => {
                            setSelectedColaborador(colaborador);
                            setActiveTab("info");
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver detalles
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======= INFO ======= */}
          <TabsContent value="info" className="space-y-6">
            {selectedColaborador ? (
              <Card>
                <CardHeader>
                  <CardTitle>Información del Colaborador</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="text-lg">
                        {selectedColaborador.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedColaborador.name}</h2>
                      <p className="text-gray-600">{selectedColaborador.company}</p>
                      <Badge variant={selectedColaborador.activo ? "default" : "secondary"}>
                        {selectedColaborador.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{selectedColaborador.rating}</p>
                        <p className="text-sm text-gray-600">Rating promedio</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <Gift className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{selectedColaborador.cupones}</p>
                        <p className="text-sm text-gray-600">Cupones activos</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">87%</p>
                        <p className="text-sm text-gray-600">Tasa de canje</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cupones y Descuentos</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>Descuento 20% en servicios</span>
                        <Badge>Activo</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>2x1 en consultoría</span>
                        <Badge variant="secondary">Pausado</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>15% descuento primera compra</span>
                        <Badge>Activo</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">
                    Selecciona un colaborador para ver su información detallada
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ======= STATS ======= */}
          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Colaboradores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Top Colaboradores por Rating</h3>
                    <div className="space-y-2">
                      {colaboradores
                        .slice()
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 5)
                        .map((colaborador, index) => (
                          <div key={colaborador.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                                {index + 1}
                              </span>
                              <span>{colaborador.name}</span>
                            </div>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {colaborador.rating}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Top Colaboradores por Cupones</h3>
                    <div className="space-y-2">
                      {colaboradores
                        .slice()
                        .sort((a, b) => b.cupones - a.cupones)
                        .slice(0, 5)
                        .map((colaborador, index) => (
                          <div key={colaborador.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">
                                {index + 1}
                              </span>
                              <span>{colaborador.name}</span>
                            </div>
                            <span className="flex items-center gap-1">
                              <Gift className="w-3 h-3 text-purple-500" />
                              {colaborador.cupones}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======= SOLICITUDES ======= */}
          <TabsContent value="solicitudes" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle>Revisión de solicitudes de negocio</CardTitle>
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar por negocio, RFC, correo o usuario…"
                      className="w-[260px]"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="border rounded-md px-3 py-2 bg-white"
                  >
                    <option value="En revision">En revisión</option>
                    <option value="Aprobada">Aprobadas</option>
                    <option value="Rechazada">Rechazadas</option>
                    <option value="Todas">Todas</option>
                  </select>
                </div>
              </CardHeader>

              <CardContent>
                {loadingSolicitudes ? (
                  <div className="flex items-center justify-center py-16 text-gray-500">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Cargando solicitudes…
                  </div>
                ) : solicitudesFiltradas.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">
                    No hay solicitudes {statusFilter !== "Todas" ? `con estado "${statusFilter}"` : ""}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {solicitudesFiltradas.map((s) => (
                      <Card key={s.id} className="hover:shadow-sm transition">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {s.negocio?.nombre?.charAt(0) ?? "N"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{s.negocio?.nombre}</div>
                                <div className="text-xs text-gray-600">{s.negocio?.rfc}</div>
                                <div className="text-xs text-gray-600">
                                  Creada: {fmtFecha(s.fecha_creacion)}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={
                                s.estatus === "En revision"
                                  ? "secondary"
                                  : s.estatus === "Aprobada"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {s.estatus}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-1 font-medium">
                                <UserCircle2 className="w-4 h-4" /> Admin
                              </div>
                              <div>{s.administrador?.nombre}</div>
                              <div className="text-xs text-gray-600">{s.administrador?.usuario}</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-1 font-medium">
                                <Building2 className="w-4 h-4" /> Negocio
                              </div>
                              <div>{s.negocio?.correo}</div>
                              <div className="text-xs text-gray-600">{s.negocio?.telefono}</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verDetalle(s.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>

                            {s.estatus === "En revision" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => aprobarSolicitud(s.id)}
                                  disabled={accionLoading}
                                >
                                  {accionLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                  )}
                                  Aprobar
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setDetalle(s);
                                    setOpenRechazar(true);
                                  }}
                                  disabled={accionLoading}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ======= Dialog Detalle ======= */}
      <Dialog open={openDetalle} onOpenChange={setOpenDetalle}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de Solicitud</DialogTitle>
          </DialogHeader>

          {!detalle ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Cargando…
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Paso 1: Datos del Administrador</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div><span className="font-medium">Nombre: </span>{detalle.administrador.nombre} {detalle.administrador.apellido_paterno} {detalle.administrador.apellido_materno}</div>
                    <div><span className="font-medium">Usuario: </span>{detalle.administrador.usuario}</div>
                    <div><span className="font-medium">Correo: </span>{detalle.administrador.correo}</div>
                    <div><span className="font-medium">Teléfono: </span>{detalle.administrador.telefono}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Paso 2: Datos del Negocio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div><span className="font-medium">Nombre: </span>{detalle.negocio.nombre}</div>
                    <div><span className="font-medium">RFC: </span>{detalle.negocio.rfc}</div>
                    <div><span className="font-medium">Correo: </span>{detalle.negocio.correo}</div>
                    <div><span className="font-medium">Teléfono: </span>{detalle.negocio.telefono}</div>
                    <div><span className="font-medium">Razón Social: </span>{detalle.negocio.razon_social ?? "-"}</div>
                    <div><span className="font-medium">Sitio Web: </span>{detalle.negocio.sitio_web ?? "-"}</div>
                    <div><span className="font-medium">Dirección: </span>
                      {[detalle.negocio.calle, detalle.negocio.numero_ext, detalle.negocio.numero_int, detalle.negocio.colonia, detalle.negocio.municipio, detalle.negocio.estado, detalle.negocio.cp]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {detalle.estatus === "En revision" && (
                <div className="flex gap-2 justify-end">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => aprobarSolicitud(detalle.id)}
                    disabled={accionLoading}
                  >
                    {accionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setOpenRechazar(true)}
                    disabled={accionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======= Dialog Rechazar ======= */}
      <Dialog open={openRechazar} onOpenChange={setOpenRechazar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Escribe el motivo de rechazo. Se enviará al solicitante.
            </p>
            <Textarea
              placeholder="Ej. RFC inválido o documentos incompletos."
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenRechazar(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => detalle && rechazarSolicitud(detalle.id, motivoRechazo)}
                disabled={accionLoading}
              >
                {accionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Confirmar rechazo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
