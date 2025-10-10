import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Users, Star, Gift, TrendingUp, Eye, LogOut } from "lucide-react";

interface AdminDashboardProps {
  onLogout: () => void;
}

// Mock data
const colaboradores = [
  { id: 1, name: 'María García', company: 'TechCorp', rating: 4.8, cupones: 12, activo: true },
  { id: 2, name: 'Carlos López', company: 'InnovaSoft', rating: 4.6, cupones: 8, activo: true },
  { id: 3, name: 'Ana Rodríguez', company: 'DigitalMax', rating: 4.9, cupones: 15, activo: false },
  { id: 4, name: 'Luis Martín', company: 'WebFlow', rating: 4.7, cupones: 10, activo: true },
  { id: 5, name: 'Sofia Chen', company: 'DataVision', rating: 4.5, cupones: 6, activo: true },
  { id: 6, name: 'Diego Ruiz', company: 'CloudTech', rating: 4.8, cupones: 9, activo: true }
];

const estadisticas = {
  totalColaboradores: 24,
  colaboradoresActivos: 18,
  cuponesSubidos: 156,
  cuponesCanjeados: 89
};

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [selectedColaborador, setSelectedColaborador] = useState<typeof colaboradores[0] | null>(null);
  const [activeTab, setActiveTab] = useState('home');

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="home">Inicio</TabsTrigger>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

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
                            setActiveTab('info');
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

          <TabsContent value="info" className="space-y-6">
            {selectedColaborador ? (
              <Card>
                <CardHeader>
                  <CardTitle>Información del Colaborador</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="text-lg">{selectedColaborador.name.charAt(0)}</AvatarFallback>
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
                  <p className="text-gray-500">Selecciona un colaborador para ver su información detallada</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

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
        </Tabs>
      </div>
    </div>
  );
}