import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Plus, Edit, Trash2, LogOut, Gift, Eye, Users } from "lucide-react";

import { logout } from '@/actions/login/auth'

interface ColaboradorDashboardProps {
  onLogout: () => void;
  colaboradorName: string;
}

interface Cupon {
  id: number;
  titulo: string;
  descripcion: string;
  descuento: string;
  validoHasta: string;
  estado: 'activo' | 'pausado' | 'vencido';
  usos: number;
}

export function ColaboradorDashboard({ onLogout, colaboradorName }: ColaboradorDashboardProps) {
  const [cupones, setCupones] = useState<Cupon[]>([
    {
      id: 1,
      titulo: 'Descuento 20% en servicios',
      descripcion: 'Obtén 20% de descuento en todos nuestros servicios de consultoría',
      descuento: '20%',
      validoHasta: '2024-12-31',
      estado: 'activo',
      usos: 45
    },
    {
      id: 2,
      titulo: '2x1 en consultoría',
      descripcion: 'Paga una sesión de consultoría y obtén la segunda gratis',
      descuento: '50%',
      validoHasta: '2024-11-30',
      estado: 'pausado',
      usos: 12
    },
    {
      id: 3,
      titulo: '15% descuento primera compra',
      descripcion: 'Descuento especial para nuevos clientes',
      descuento: '15%',
      validoHasta: '2024-10-15',
      estado: 'vencido',
      usos: 28
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingCupon, setEditingCupon] = useState<Cupon | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    descuento: '',
    validoHasta: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCupon) {
      setCupones(prev => prev.map(cupon => 
        cupon.id === editingCupon.id 
          ? { ...cupon, ...formData }
          : cupon
      ));
      setEditingCupon(null);
    } else {
      const newCupon: Cupon = {
        id: Date.now(),
        ...formData,
        estado: 'activo',
        usos: 0
      };
      setCupones(prev => [...prev, newCupon]);
    }
    
    setFormData({ titulo: '', descripcion: '', descuento: '', validoHasta: '' });
    setIsCreating(false);
  };

  const handleEdit = (cupon: Cupon) => {
    setEditingCupon(cupon);
    setFormData({
      titulo: cupon.titulo,
      descripcion: cupon.descripcion,
      descuento: cupon.descuento,
      validoHasta: cupon.validoHasta
    });
    setIsCreating(true);
  };

  const handleDelete = (id: number) => {
    setCupones(prev => prev.filter(cupon => cupon.id !== id));
  };

  const toggleEstado = (id: number) => {
    setCupones(prev => prev.map(cupon => 
      cupon.id === id 
        ? { ...cupon, estado: cupon.estado === 'activo' ? 'pausado' : 'activo' }
        : cupon
    ));
  };

  const stats = {
    totalCupones: cupones.length,
    cuponesActivos: cupones.filter(c => c.estado === 'activo').length,
    totalUsos: cupones.reduce((acc, c) => acc + c.usos, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-10 h-10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Panel de Colaborador</h1>
              <p className="text-sm text-gray-600">Bienvenido, {colaboradorName}</p>
            </div>
          </div>
          <form action={logout}>
            <Button variant="outline" type="submit">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Cupones</p>
                  <p className="text-2xl font-bold">{stats.totalCupones}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Cupones Activos</p>
                  <p className="text-2xl font-bold">{stats.cuponesActivos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Usos</p>
                  <p className="text-2xl font-bold">{stats.totalUsos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header de cupones */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mis Cupones</h2>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                onClick={() => {
                  setEditingCupon(null);
                  setFormData({ titulo: '', descripcion: '', descuento: '', validoHasta: '' });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cupón
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título del cupón</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descuento">Descuento</Label>
                  <Input
                    id="descuento"
                    value={formData.descuento}
                    onChange={(e) => setFormData(prev => ({ ...prev, descuento: e.target.value }))}
                    placeholder="ej: 20%, $50, 2x1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="validoHasta">Válido hasta</Label>
                  <Input
                    id="validoHasta"
                    type="date"
                    value={formData.validoHasta}
                    onChange={(e) => setFormData(prev => ({ ...prev, validoHasta: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingCupon ? 'Actualizar' : 'Crear'} Cupón
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreating(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de cupones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cupones.map((cupon) => (
            <Card key={cupon.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{cupon.titulo}</CardTitle>
                  <Badge 
                    variant={
                      cupon.estado === 'activo' ? 'default' : 
                      cupon.estado === 'pausado' ? 'secondary' : 'destructive'
                    }
                  >
                    {cupon.estado}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">{cupon.descripcion}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Descuento:</span>
                    <span className="font-semibold text-green-600">{cupon.descuento}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Válido hasta:</span>
                    <span>{cupon.validoHasta}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Usos:</span>
                    <span className="font-semibold">{cupon.usos}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEdit(cupon)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  
                  {cupon.estado !== 'vencido' && (
                    <Button 
                      size="sm" 
                      variant={cupon.estado === 'activo' ? 'secondary' : 'default'}
                      onClick={() => toggleEstado(cupon.id)}
                    >
                      {cupon.estado === 'activo' ? 'Pausar' : 'Activar'}
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(cupon.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {cupones.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes cupones aún</h3>
              <p className="text-gray-600 mb-4">Crea tu primer cupón para que los usuarios puedan canjearlo</p>
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear mi primer cupón
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}