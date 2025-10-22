// actions/colaboradores/registro_solicitud.ts
'use server';

import axios from 'axios';
import type { RegistroPayload } from '@/components/types/registro';

const apiHost = (process.env.API_HOST ?? '').replace(/\/+$/, ''); // http://localhost:8000
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

// arma FormData con claves "negocio.*" y "administrador.*"
function buildFormData(payload: RegistroPayload): FormData {
  const fd = new FormData();

  const { administrador, negocio } = payload;

  // el backend aún pide 'administrador.usuario' → derivamos del correo si no viene
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
  if ((negocio as any).maps_url) fd.append('negocio.maps_url', (negocio as any).maps_url);
  fd.append('negocio.estatus', negocio.estatus ?? 'En revision');

  fd.append('negocio.cp', negocio.cp);
  fd.append('negocio.numero_ext', negocio.numero_ext);
  if (negocio.numero_int) fd.append('negocio.numero_int', negocio.numero_int);
  fd.append('negocio.colonia', negocio.colonia);
  fd.append('negocio.municipio', negocio.municipio);
  fd.append('negocio.estado', negocio.estado);

  // file: preferimos enviar en "file" (como en tu Postman)
  if (negocio.file?.startsWith?.('data:')) {
    const file = dataURLtoFile(negocio.file);
    if (file) fd.append('file', file, file.name);
  } else if (negocio.file) {
    // si traes URL, el backend puede aceptarla como texto
    fd.append('negocio.file', negocio.file);
  }

  return fd;
}

type Resp = { ok: boolean; status: number; data?: any; error?: string };

/**
 * Puede recibir:
 *  - FormData ya armado (ideal si lo construiste en route.ts), o
 *  - Un RegistroPayload para armar aquí el FormData.
 */
export async function registrarSolicitud(formOrJson: FormData | RegistroPayload): Promise<Resp> {
  try {
    const body =
      typeof FormData !== 'undefined' && formOrJson instanceof FormData
        ? formOrJson
        : buildFormData(formOrJson as RegistroPayload);

    const { data, status } = await axios.post(URL, body, {
      // ¡NO pongas Content-Type! axios pone el boundary al enviar FormData
      validateStatus: () => true,
    });

    if (status >= 200 && status < 300) {
      return { ok: true, data, status };
    }
    const msg =
      (typeof data === 'string' && data) ||
      data?.message ||
      data?.detail ||
      JSON.stringify(data || {});
    return { ok: false, status, error: msg || 'Error desconocido' };
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const data = err?.response?.data;
    const msg =
      (typeof data === 'string' && data) ||
      data?.message ||
      data?.detail ||
      err?.message ||
      'Error interno';
    return { ok: false, status, error: msg };
  }
}
