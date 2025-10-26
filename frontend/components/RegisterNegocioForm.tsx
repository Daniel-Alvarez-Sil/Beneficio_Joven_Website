// components/RegisterNegocioForm.tsx

/**
 * Componente: RegisterNegocioForm
 * Descripción:
 *   Paso 2 del registro público de Colaborador/Negocio. Completa los datos del negocio,
 *   anexa (opcionalmente) un logo y envía la solicitud a la API interna `/api/create-colaborador`,
 *   combinando la información del administrador capturada en el Paso 1 (leída de localStorage)
 *   con la del negocio (Paso 2).
 *
 * Flujo general (UX):
 *   1) Montaje:
 *      - Lee `registro_admin` desde localStorage. Si no existe, redirige a `/registro/colaborador`.
 *      - Restaura un borrador de negocio desde `registro_negocio_tmp` (autosave).
 *   2) Edición:
 *      - Cada cambio se persiste en `registro_negocio_tmp` (incluye nombre del archivo seleccionado).
 *      - La imagen (logo) se guarda como DataURL (base64) para vista previa/almacenamiento temporal.
 *   3) Envío:
 *      - Construye un `FormData` con subcampos `administrador.*` y `negocio.*`.
 *      - Convierte el `logo` (base64) a `Blob` para enviarlo como `file` (opcional).
 *      - Envía POST a `/api/create-colaborador`.
 *      - Si la creación es exitosa, limpia localStorage y navega a `/registro/gracias`.
 *
 * API / Contrato de envío:
 *   - ADMIN (derivado del Paso 1):
 *     administrador.correo, administrador.telefono, administrador.nombre,
 *     administrador.apellido_paterno, administrador.apellido_materno,
 *     administrador.usuario (derivado del correo), administrador.contrasena
 *   - NEGOCIO:
 *     negocio.correo, negocio.telefono, negocio.nombre, negocio.rfc,
 *     negocio.sitio_web, negocio.estatus, negocio.cp, negocio.numero_ext,
 *     negocio.numero_int, negocio.colonia, negocio.municipio, negocio.estado,
 *     negocio.url_maps (tomado de `maps_url`)
 *   - Archivo opcional:
 *     file (logo como `File`), creado a partir de `form.logo` (base64)
 *   - Bandera:
 *     creado_por_admin: 'false' (flujo público)
 *
 * Persistencia local (autosave):
 *   - Claves: `registro_admin` (Paso 1) y `registro_negocio_tmp` (Paso 2).
 *   - Además se almacena `__logoFileName` para recordar el nombre del archivo.
 *
 * Validaciones/UI:
 *   - Requeridos: nombre, rfc, teléfono, correo, cp, número exterior, colonia, municipio, estado.
 *   - `maps_url` opcional (se mapea a `negocio.url_maps`).
 *   - Límite de tamaño del logo: ~2.5MB (2.4MB comprobados).
 *   - Botón de envío muestra toast simple de éxito.
 *
 * Accesibilidad:
 *   - Labels asociados a inputs (`htmlFor`/`id`).
 *   - Input de archivo oculto con `label` clickeable y áreas accesibles.
 *   - Mensajes claros de error mediante `alert()` para condiciones básicas.
 *
 * Seguridad y notas:
 *   - Este paso requiere que la información sensible del admin (incl. contraseña) haya sido
 *     guardada previamente en localStorage por el Paso 1. Considera riesgos de persistir contraseñas
 *     en localStorage (en producción, evaluar alternativas o cifrado).
 *   - La conversión `fetch(dataURL)` → `Blob` evita subir el base64 directamente.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 */

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
    if (!admin) {
      alert('Faltan datos del administrador (Paso 1).');
      return;
    }

    // 1) Armamos FormData tal como en NegociosGrid.tsx
    const fd = new FormData();

    // --- ADMINISTRADOR ---
    fd.append('administrador.correo', admin.correo ?? '');
    fd.append('administrador.telefono', admin.telefono ?? '');
    fd.append('administrador.nombre', admin.nombre ?? '');
    fd.append('administrador.apellido_paterno', admin.apellido_paterno ?? '');
    fd.append('administrador.apellido_materno', admin.apellido_materno ?? '');
    // Para registro público no pides 'usuario'; puedes derivarlo del correo:
    const usuarioSugerido =
      (admin.correo?.split('@')?.[0] ?? admin.nombre ?? 'usuario').toLowerCase();
    fd.append('administrador.usuario', usuarioSugerido);
    fd.append('administrador.contrasena', admin.contrasena ?? '');

    // --- NEGOCIO ---
    fd.append('negocio.correo', form.correo ?? '');
    fd.append('negocio.telefono', form.telefono ?? '');
    fd.append('negocio.nombre', form.nombre ?? '');
    fd.append('negocio.rfc', form.rfc ?? '');
    fd.append('negocio.sitio_web', form.sitio_web ?? '');
    fd.append('negocio.estatus', form.estatus ?? 'En revision');
    fd.append('negocio.cp', form.cp ?? '');
    fd.append('negocio.numero_ext', form.numero_ext ?? '');
    fd.append('negocio.numero_int', form.numero_int ?? '');
    fd.append('negocio.colonia', form.colonia ?? '');
    fd.append('negocio.municipio', form.municipio ?? '');
    fd.append('negocio.estado', form.estado ?? '');
    fd.append('negocio.url_maps', (form as any).maps_url ?? '');

    // --- LOGO opcional como 'file' ---
    // Tú guardaste base64 en form.logo; lo convertimos a Blob para mandarlo como archivo:
    if ((form as any).logo) {
      try {
        // truco: fetch del dataURL → Blob
        const blob = await (await fetch((form as any).logo)).blob();
        const name = logoFileName || 'logo.png';
        fd.append('file', new File([blob], name, { type: blob.type || 'image/png' }));
      } catch {}
    }

    // --- Bandera de origen ---
    // En el panel de admin la ponías "true". Aquí es flujo público, así que "false".
    fd.append('creado_por_admin', 'false');

    // 2) POST a tu ruta que ya llama createColaborador (mismo TS)
    const resp = await fetch('/api/create-colaborador', {
      method: 'POST',
      body: fd,
    });

    if (resp.ok) {
      localStorage.removeItem(LS_ADMIN_KEY);
      localStorage.removeItem(LS_NEGOCIO_KEY);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        // Gracias / success
        router.push('/registro/gracias');
      }, 1500);
    } else {
      const { message } = await resp.json().catch(() => ({}));
      alert(message ?? 'No se pudo registrar el colaborador.');
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
