'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AuthLayout } from './AuthLayout';
import type { AdminInput } from '@/components/types/registro';

const LS_ADMIN_KEY = 'registro_admin';

export function RegisterAdminNegocioForm() {
  const router = useRouter();
  const [form, setForm] = useState<AdminInput>({
    correo: '',
    telefono: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    usuario: '',
    contrasena: '',
  });

  // Carga borrador
  useEffect(() => {
    const raw = localStorage.getItem(LS_ADMIN_KEY);
    if (raw) {
      try { setForm(JSON.parse(raw)); } catch {}
    }
  }, []);

  // Autosave
  useEffect(() => {
    localStorage.setItem(LS_ADMIN_KEY, JSON.stringify(form));
  }, [form]);

  const onChange = (k: keyof AdminInput, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // Bloquea Enter para que NO ocurra ninguna acción accidental
  const blockEnter: React.KeyboardEventHandler = (e) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const goToStep2 = () => {
    // NO fetch, NO server action, NO POST — solo navegación
    router.push('/registro/negocio');
  };

  return (
    <AuthLayout title="REGISTRO (Paso 1)" subtitle="Administrador del negocio">
      {/* Importante: SIN <form> */}
      <div className="space-y-4" onKeyDown={blockEnter}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => onChange('nombre', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellido_paterno">Apellido paterno</Label>
            <Input id="apellido_paterno" value={form.apellido_paterno} onChange={(e) => onChange('apellido_paterno', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellido_materno">Apellido materno</Label>
            <Input id="apellido_materno" value={form.apellido_materno} onChange={(e) => onChange('apellido_materno', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" value={form.telefono} onChange={(e) => onChange('telefono', e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="correo">Correo</Label>
          <Input id="correo" type="email" value={form.correo} onChange={(e) => onChange('correo', e.target.value)} required />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usuario">Usuario</Label>
            <Input id="usuario" value={form.usuario} onChange={(e) => onChange('usuario', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contrasena">Contraseña</Label>
            <Input id="contrasena" type="password" value={form.contrasena} onChange={(e) => onChange('contrasena', e.target.value)} required />
          </div>
        </div>

        <Button type="button" onClick={goToStep2} className="w-full btn-gradient text-white">
          Continuar al Paso 2
        </Button>
      </div>
    </AuthLayout>
  );
}
