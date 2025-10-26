// actions/colaboradores/registro_solicitud.ts
'use server';

/**
 * Módulo: actions/colaboradores/registro_solicitud
 * Descripción: Server Action que registra una solicitud de alta de negocio + administrador.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo general:
 * 1) Convierte (si aplica) un dataURL base64 de imagen/logo a `File`.
 * 2) Construye un `FormData` con los campos anidados de administrador y negocio.
 * 3) Envía la solicitud vía `fetch` con método POST al endpoint:
 *      `${API_HOST}/functionality/administradores-negocio/`
 * 4) Retorna un objeto `{ ok, status, data? | error? }` normalizado.
 *
 * Notas:
 * - No se fija manualmente el `Content-Type` para permitir el `boundary` correcto.
 * - Los campos anidados usan claves tipo `administrador.campo` y `negocio.campo`.
 * - Se admite `FormData` ya armado o un `RegistroPayload` (se construye internamente).
 */

import type { RegistroPayload } from '@/components/types/registro';

const apiHost = (process.env.API_HOST ?? '').replace(/\/+$/, '');
const URL = `${apiHost}/functionality/administradores-negocio/`;

// util: dataURL -> File (Blob) con nombre y mime correctos
function dataURLtoFile(dataUrl: string, filenameBase = 'file_negocio') {
  if (!dataUrl?.startsWith?.('data:')) return null;
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
  const ext = mime.split('/')[1] || 'bin';
  const buffer = Buffer.from(base64, 'base64');
  const blob = new Blob([buffer], { type: mime });
  return new File([blob], `${filenameBase}.${ext}`, { type: mime });
}

function buildFormData(payload: RegistroPayload): FormData {
  const fd = new FormData();
  const { administrador, negocio } = payload;

  const usuario =
    (administrador as any).usuario ??
    administrador.correo?.split?.('@')?.[0] ??
    administrador.nombre ??
    'usuario';

  // ---- ADMIN ----
  fd.append('administrador.correo', administrador.correo);
  fd.append('administrador.telefono', administrador.telefono);
  fd.append('administrador.nombre', administrador.nombre);
  fd.append('administrador.apellido_paterno', administrador.apellido_paterno);
  fd.append('administrador.apellido_materno', administrador.apellido_materno);
  fd.append('administrador.usuario', String(usuario).toLowerCase());
  fd.append('administrador.contrasena', administrador.contrasena);

  // ---- NEGOCIO ----
  fd.append('negocio.correo', negocio.correo);
  fd.append('negocio.telefono', negocio.telefono);
  fd.append('negocio.nombre', negocio.nombre);
  fd.append('negocio.rfc', negocio.rfc);
  if (negocio.sitio_web) fd.append('negocio.sitio_web', negocio.sitio_web);

  // 🔧 CLAVE CORRECTA:
  const maps = (negocio as any).maps_url ?? (negocio as any).url_maps;
  if (maps) fd.append('negocio.url_maps', maps);

  fd.append('negocio.estatus', negocio.estatus ?? 'En revision');
  fd.append('negocio.cp', negocio.cp);
  fd.append('negocio.numero_ext', negocio.numero_ext);
  if (negocio.numero_int) fd.append('negocio.numero_int', negocio.numero_int);
  fd.append('negocio.colonia', negocio.colonia);
  fd.append('negocio.municipio', negocio.municipio);
  fd.append('negocio.estado', negocio.estado);

  // 🏷 origen del flujo
  fd.append('creado_por_admin', 'false');

  // ---- FILE (acepta file o logo en base64) ----
  const base64 = (negocio as any).file ?? (negocio as any).logo;
  if (base64?.startsWith?.('data:')) {
    const file = dataURLtoFile(base64);
    if (file) fd.append('file', file, file.name);
  } else if ((negocio as any).file) {
    fd.append('negocio.file', (negocio as any).file);
  }

  return fd;
}

type Resp = { ok: boolean; status: number; data?: any; error?: string };

/**
 * Registra una solicitud de alta de negocio + administrador.
 * @param formOrJson `FormData` ya preparado o `RegistroPayload` (se convertirá a `FormData`).
 * @returns {Promise<Resp>} Objeto con `ok`, `status` y `data`/`error`.
 */
export async function registrarSolicitud(formOrJson: FormData | RegistroPayload): Promise<Resp> {
  try {
    const body =
      typeof FormData !== 'undefined' && formOrJson instanceof FormData
        ? formOrJson
        : buildFormData(formOrJson as RegistroPayload);

    // ✅ Usa fetch para evitar issues de boundary con axios en server
    const resp = await fetch(URL, { method: 'POST', body });
    const status = resp.status;
    const text = await resp.text().catch(() => '');

    if (status >= 200 && status < 300) {
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      return { ok: true, status, data };
    }

    return {
      ok: false,
      status,
      error: text || 'Error desconocido',
    };
  } catch (err: any) {
    return {
      ok: false,
      status: err?.response?.status ?? 500,
      error: err?.message ?? 'Error interno',
    };
  }
}
