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
    contrasena: '',
  });

  useEffect(() => {
    const raw = localStorage.getItem(LS_ADMIN_KEY);
    if (raw) {
      try { setForm(JSON.parse(raw)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_ADMIN_KEY, JSON.stringify(form));
  }, [form]);

  const onChange = (k: keyof AdminInput, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const blockEnter: React.KeyboardEventHandler = (e) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const goToStep2 = () => router.push('/registro/negocio');

  return (
    <AuthLayout title="REGISTRO (Paso 1)" subtitle="Administrador del negocio">
      <div className="space-y-4" onKeyDown={blockEnter}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 text-white">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => onChange('nombre', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
          <div className="space-y-2 text-white">
            <Label htmlFor="apellido_paterno">Apellido paterno</Label>
            <Input id="apellido_paterno" value={form.apellido_paterno} onChange={(e) => onChange('apellido_paterno', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
          <div className="space-y-2 text-white">
            <Label htmlFor="apellido_materno">Apellido materno</Label>
            <Input id="apellido_materno" value={form.apellido_materno} onChange={(e) => onChange('apellido_materno', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
          <div className="space-y-2 text-white">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" value={form.telefono} onChange={(e) => onChange('telefono', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
        </div>

        <div className="space-y-2 text-white">
          <Label htmlFor="correo">Correo</Label>
          <Input id="correo" type="email" value={form.correo} onChange={(e) => onChange('correo', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
        </div>

        <div className="space-y-2 text-white">
          <Label htmlFor="contrasena">Contraseña</Label>
          <Input id="contrasena" type="password" value={form.contrasena} onChange={(e) => onChange('contrasena', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" autoComplete="new-password" />
        </div>

        <Button type="button" onClick={goToStep2} className="w-full btn-gradient btn-apple text-white">
          Continuar al Paso 2
        </Button>
      </div>
    </AuthLayout>
  );
}
