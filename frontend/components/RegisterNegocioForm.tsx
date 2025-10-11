'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AuthLayout } from "./AuthLayout";
import type { AdminNegocioInput, NegocioInput, SolicitudRegistroPayload } from "@/components/types/registro";

export function RegisterNegocioForm() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminNegocioInput | null>(null);
  const [form, setForm] = useState<NegocioInput>({
    correo: "",
    telefono: "",
    nombre: "",
    rfc: "",
    sitio_web: "",
    cp: "",
    numero_ext: "",
    numero_int: "",
    colonia: "",
    municipio: "",
    estado: "",
    logo: "",
  });

  useEffect(() => {
    const raw = localStorage.getItem("registro_admin_negocio");
    if (!raw) {
      // Si no llenó el paso 1, lo regresamos
      router.replace("/registro/colaborador");
      return;
    }
    setAdmin(JSON.parse(raw));
  }, [router]);

  const onChange = (field: keyof NegocioInput, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleLogoAsBase64: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange("logo", String(reader.result)); // base64
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;

    const payload: SolicitudRegistroPayload = {
      administrador_negocio: admin,
      negocio: form,
    };

    // Llamada a tu API (ejemplo con Next.js route handler)
    const res = await fetch("/api/solicitudes/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      // limpiar y redirigir a gracias/login
      localStorage.removeItem("registro_admin_negocio");
      router.push("/registro/gracias"); // crea una página simple de confirmación
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.message ?? "No se pudo enviar la solicitud.");
    }
  };

  return (
    <AuthLayout title="REGISTRO (Paso 2)" subtitle="Datos del negocio">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del negocio</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => onChange("nombre", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rfc">RFC</Label>
            <Input id="rfc" value={form.rfc} onChange={(e) => onChange("rfc", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" value={form.telefono} onChange={(e) => onChange("telefono", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" type="email" value={form.correo} onChange={(e) => onChange("correo", e.target.value)} required/>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sitio_web">Sitio web (opcional)</Label>
          <Input id="sitio_web" value={form.sitio_web ?? ""} onChange={(e) => onChange("sitio_web", e.target.value)} />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cp">Código Postal</Label>
            <Input id="cp" value={form.cp} onChange={(e) => onChange("cp", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero_ext">Número exterior</Label>
            <Input id="numero_ext" value={form.numero_ext} onChange={(e) => onChange("numero_ext", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero_int">Número interior (opcional)</Label>
            <Input id="numero_int" value={form.numero_int ?? ""} onChange={(e) => onChange("numero_int", e.target.value)} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="colonia">Colonia</Label>
            <Input id="colonia" value={form.colonia} onChange={(e) => onChange("colonia", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipio">Municipio</Label>
            <Input id="municipio" value={form.municipio} onChange={(e) => onChange("municipio", e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Input id="estado" value={form.estado} onChange={(e) => onChange("estado", e.target.value)} required/>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo (opcional)</Label>
          <Input id="logo" type="file" accept="image/*" onChange={handleLogoAsBase64}/>
        </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
          Enviar solicitud
        </Button>
      </form>
    </AuthLayout>
  );
}
