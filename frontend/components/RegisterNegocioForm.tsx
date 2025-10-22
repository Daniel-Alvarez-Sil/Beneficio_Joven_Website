'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AuthLayout } from './AuthLayout';
import type { AdminInput, NegocioInput, RegistroPayload } from '@/components/types/registro';

const LS_ADMIN_KEY = 'registro_admin';
const LS_NEGOCIO_KEY = 'registro_negocio_tmp';

export function RegisterNegocioForm() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminInput | null>(null);

  const [form, setForm] = useState<NegocioInput>({
    correo: '',
    telefono: '',
    nombre: '',
    rfc: '',
    sitio_web: '',
    maps_url: '',          // ← ya existe en el tipo
    estatus: 'En revision',
    cp: '',
    numero_ext: '',
    numero_int: '',
    colonia: '',
    municipio: '',
    estado: '',
    file: '',
  });

  const [showToast, setShowToast] = useState(false);
  const [logoFileName, setLogoFileName] = useState<string>('');

  useEffect(() => {
    const raw = localStorage.getItem(LS_ADMIN_KEY);
    if (!raw) {
      router.replace('/registro/colaborador');
      return;
    }
    try { setAdmin(JSON.parse(raw)); } catch {}

    const draft = localStorage.getItem(LS_NEGOCIO_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setForm((prev) => ({ ...prev, ...parsed }));
        if (parsed.__logoFileName) setLogoFileName(parsed.__logoFileName);
      } catch {}
    }
  }, [router]);

  const persist = (next: NegocioInput & { __logoFileName?: string }) => {
    localStorage.setItem(LS_NEGOCIO_KEY, JSON.stringify(next));
  };

  const onChange = (field: keyof NegocioInput, value: string) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      persist({ ...next, __logoFileName: logoFileName });
      return next;
    });

  const handleLogoAsBase64: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.4 * 1024 * 1024) {
      alert('La imagen debe pesar máximo 2.5MB');
      return;
    }
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => {
        const next = { ...prev, logo: String(reader.result) };
        localStorage.setItem('registro_negocio_tmp', JSON.stringify({ ...next, __logoFileName: file.name }));
        return next;
      });
    };
    reader.readAsDataURL(file);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;

    const payload: RegistroPayload = {
      negocio: { ...form, estatus: 'En revision' },
      administrador: admin,
    };

    const res = await fetch('/api/solicitudes/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-from-step': '2',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      localStorage.removeItem(LS_ADMIN_KEY);
      localStorage.removeItem(LS_NEGOCIO_KEY);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/registro/gracias');
      }, 2500);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.message ?? 'No se pudo enviar la solicitud.');
    }
  };

  return (
    <AuthLayout title="REGISTRO (Paso 2)" subtitle="Datos del negocio">
      <form onSubmit={handleSubmit} className="space-y-4 relative">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 text-white">
            <Label htmlFor="nombre">Nombre del negocio</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => onChange('nombre', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
          <div className="space-y-2 text-white">
            <Label htmlFor="rfc">RFC</Label>
            <Input id="rfc" value={form.rfc} onChange={(e) => onChange('rfc', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
          <div className="space-y-2 text-white">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" value={form.telefono} onChange={(e) => onChange('telefono', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
          <div className="space-y-2 text-white">
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" type="email" value={form.correo} onChange={(e) => onChange('correo', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
        </div>

        <div className="space-y-2 text-white">
          <Label htmlFor="sitio_web">Sitio web (opcional)</Label>
          <Input id="sitio_web" value={form.sitio_web ?? ''} onChange={(e) => onChange('sitio_web', e.target.value)} className="input-apple text-white placeholder-white/50 caret-white" />
        </div>

        <div className="space-y-2 text-white">
          <Label htmlFor="maps_url">Ubicación (Google Maps URL)</Label>
          <Input
            id="maps_url"
            type="url"
            placeholder="https://maps.google.com/?q=..."
            value={form.maps_url ?? ''}
            onChange={(e) => onChange('maps_url', e.target.value)}
            className="input-apple text-white placeholder-white/50 caret-white"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2 text-white">
            <Label htmlFor="cp">Código Postal</Label>
            <Input id="cp" value={form.cp} onChange={(e) => onChange('cp', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
          <div className="space-y-2 text-white">
            <Label htmlFor="numero_ext">Número exterior</Label>
            <Input id="numero_ext" value={form.numero_ext} onChange={(e) => onChange('numero_ext', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
          <div className="space-y-2 text-white">
            <Label htmlFor="numero_int">Número interior (opcional)</Label>
            <Input id="numero_int" value={form.numero_int ?? ''} onChange={(e) => onChange('numero_int', e.target.value)} className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2 text-white">
            <Label htmlFor="colonia">Colonia</Label>
            <Input id="colonia" value={form.colonia} onChange={(e) => onChange('colonia', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
          <div className="space-y-2 text-white">
            <Label htmlFor="municipio">Municipio</Label>
            <Input id="municipio" value={form.municipio} onChange={(e) => onChange('municipio', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
          <div className="space-y-2 text-white">
            <Label htmlFor="estado">Estado</Label>
            <Input id="estado" value={form.estado} onChange={(e) => onChange('estado', e.target.value)} required className="input-apple text-white placeholder-white/50 caret-white" />
          </div>
        </div>

        <div className="space-y-2 text-white">
          <Label htmlFor="logo">Logo (opcional)</Label>
          <input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoAsBase64}
            className="sr-only"
          />
          <label
            htmlFor="logo"
            className="flex items-center justify-center text-center w-full h-24 rounded-xl border border-white/25 bg-white/5 hover:bg-white/10 transition cursor-pointer"
          >
            <div className="px-4">
              <div className="text-sm text-white/80">
                {logoFileName ? (
                  <>Archivo seleccionado: <span className="font-medium">{logoFileName}</span></>
                ) : (
                  <>Haz clic o arrastra una imagen aquí</>
                )}
              </div>
              <div className="text-xs text-white/60 mt-1">PNG, JPG o SVG</div>
            </div>
          </label>
        </div>

        <Button type="submit" className="w-full btn-gradient btn-apple text-white">Enviar solicitud</Button>

        {showToast && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-xl text-lg animate-fade-in">
              ✅ Solicitud enviada con éxito
            </div>
          </div>
        )}
      </form>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fadeIn .25s ease-out forwards; }
      `}</style>
    </AuthLayout>
  );
}
