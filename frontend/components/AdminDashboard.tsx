"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { toast } from "sonner";
import {
  Users,
  Star,
  Gift,
  TrendingUp,
  Eye,
  LogOut,
} from "lucide-react";

// ⬇️ charts
import { PieChart, Pie, Label, RadialBarChart, RadialBar, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

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

interface HeaderStats {
  promociones_por_negocio_ultimo_mes: Record<string, number>;
  canjes_por_negocio_ultimo_mes: Record<string, number>;
  promociones_activas_por_negocio: Record<string, number>;
  total_colaboradores: number;
}

// =========================
// Mock colaboradores (lo demás queda tal cual)
// =========================
const colaboradores = [
  { id: 1, name: "María García", company: "TechCorp", rating: 4.8, cupones: 12, activo: true },
  { id: 2, name: "Carlos López", company: "InnovaSoft", rating: 4.6, cupones: 8, activo: true },
  { id: 3, name: "Ana Rodríguez", company: "DigitalMax", rating: 4.9, cupones: 15, activo: false },
  { id: 4, name: "Luis Martín", company: "WebFlow", rating: 4.7, cupones: 10, activo: true },
  { id: 5, name: "Sofia Chen", company: "DataVision", rating: 4.5, cupones: 6, activo: true },
  { id: 6, name: "Diego Ruiz", company: "CloudTech", rating: 4.8, cupones: 9, activo: true },
];

// =========================
// Helpers para charts
// =========================
const COLOR_VARS = Array.from({ length: 12 }, (_, i) => `var(--chart-${i + 1})`);

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type DonutDatum = { name: string; value: number; fill: string; slug: string };

function objectToDonutData(obj?: Record<string, number>): DonutDatum[] {
  if (!obj) return [];
  return Object.entries(obj).map(([name, value], i) => {
    const slug = slugify(name || `item-${i}`);
    return {
      name,
      value: Number(value) || 0,
      slug,
      fill: `var(--color-${slug})`, // ← se inyecta por ChartContainer via config
    };
  });
}

function buildChartConfig(data: DonutDatum[]): ChartConfig {
  const cfg: ChartConfig = {
    value: { label: "Total" },
  } as ChartConfig;

  data.forEach((d, i) => {
    (cfg as any)[d.slug] = {
      label: d.name,
      color: COLOR_VARS[i % COLOR_VARS.length],
    };
  });

  return cfg;
}

// =========================
// Componentes de tarjeta
// =========================
function SimpleStatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DonutCard({
  title,
  subtitle,
  dataObj,
  centerLabel = "Total",
}: {
  title: string;
  subtitle?: string;
  dataObj?: Record<string, number>;
  centerLabel?: string;
}) {
  const data = useMemo(() => objectToDonutData(dataObj), [dataObj]);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const config = useMemo(() => buildChartConfig(data), [data]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const cx = viewBox.cx as number;
                    const cy = viewBox.cy as number;
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy} className="fill-foreground text-3xl font-bold">
                          {total.toLocaleString("es-MX")}
                        </tspan>
                        <tspan x={cx} y={cy + 24} className="fill-muted-foreground">
                          {centerLabel}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Distribución por negocio <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  );
}

// =========================
// Componente principal
// =========================
export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [selectedColaborador, setSelectedColaborador] = useState<(typeof colaboradores)[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "info" | "stats" | "solicitudes">("home");

  // Solicitudes (tu lógica actual) ...
  const [solicitudes, setSolicitudes] = useState<SolicitudNegocio[]>([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EstatusSolicitud | "Todas">("En revision");

  // Header stats (nuevo)
  const [headerStats, setHeaderStats] = useState<HeaderStats | null>(null);
  const [loadingHeader, setLoadingHeader] = useState(false);

  async function fetchHeader() {
    try {
      setLoadingHeader(true);
      // Si puedes importar el server action directo, úsalo. Si no, usa este endpoint:
      const res = await fetch("/api/estadisticas-header");
      if (!res.ok) throw new Error("No se pudieron obtener las estadísticas de cabecera.");
      const data: HeaderStats = await res.json();
      setHeaderStats(data);
    } catch (err: any) {
      toast.error("Error al cargar estadísticas", { description: err?.message });
    } finally {
      setLoadingHeader(false);
    }
  }

  useEffect(() => {
    fetchHeader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ... tu lógica de solicitudes (verDetalle, aprobar, rechazar, etc.) permanece igual

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="home">Dashboard</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          </TabsList>

          {/* ======= HOME ======= */}
          <TabsContent value="home" className="space-y-6">
            {/* Top 4 cards (reemplazados) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 1) Total colaboradores */}
              <SimpleStatCard
                title="Total Colaboradores"
                value={loadingHeader ? "—" : headerStats?.total_colaboradores ?? 0}
                icon={<Users className="w-5 h-5 text-blue-500" />}
              />

              {/* 2) Promociones último mes (donut) */}
              <DonutCard
                title="Promociones (último mes)"
                subtitle="Por negocio"
                dataObj={headerStats?.promociones_por_negocio_ultimo_mes}
                centerLabel="Total"
              />

              {/* 3) Canjes último mes (donut) */}
              <DonutCard
                title="Canjes (último mes)"
                subtitle="Por negocio"
                dataObj={headerStats?.canjes_por_negocio_ultimo_mes}
                centerLabel="Total"
              />

              {/* 4) Promociones activas (donut) */}
              <DonutCard
                title="Promociones activas"
                subtitle="Por negocio"
                dataObj={headerStats?.promociones_activas_por_negocio}
                centerLabel="Total"
              />
            </div>

            {/* Resto de tu contenido (lista de colaboradores, etc.) */}
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

          {/* ======= SOLICITUDES ======= */}
          {/* ... tu contenido actual para solicitudes ... */}
        </Tabs>
      </div>
    </div>
  );
}
