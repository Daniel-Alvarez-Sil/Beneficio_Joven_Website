'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AuthLayout } from "./AuthLayout";
import type { AdminNegocioInput } from "@/components/types/registro";

export function RegisterAdminNegocioForm() {
  const router = useRouter();
  const [form, setForm] = useState<AdminNegocioInput>({
    correo: "",
    telefono: "",
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    usuario: "",
    contraseña: "",
  });

  const onChange = (field: keyof AdminNegocioInput, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Guardamos en localStorage para consumirlo en el paso 2.
    localStorage.setItem("registro_admin_negocio", JSON.stringify(form));
    // Navegamos a la página del negocio (paso 2)
    router.push("/registro/negocio");
  };

  return (
    <AuthLayout title="REGISTRO (Paso 1)" subtitle="Administrador del negocio">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => onChange("nombre", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellido_paterno">Apellido paterno</Label>
            <Input id="apellido_paterno" value={form.apellido_paterno} onChange={(e) => onChange("apellido_paterno", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellido_materno">Apellido materno</Label>
            <Input id="apellido_materno" value={form.apellido_materno} onChange={(e) => onChange("apellido_materno", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" value={form.telefono} onChange={(e) => onChange("telefono", e.target.value)} required/>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="correo">Correo</Label>
          <Input id="correo" type="email" value={form.correo} onChange={(e) => onChange("correo", e.target.value)} required/>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usuario">Usuario</Label>
            <Input id="usuario" value={form.usuario} onChange={(e) => onChange("usuario", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contraseña">Contraseña</Label>
            <Input id="contraseña" type="password" value={form.contraseña} onChange={(e) => onChange("contraseña", e.target.value)} required/>
          </div>
        </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
          Continuar al Paso 2
        </Button>
      </form>
    </AuthLayout>
  );
}
