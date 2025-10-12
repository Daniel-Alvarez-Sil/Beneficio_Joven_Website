// actions/colaboradores/registro_solicitud.ts
'use server';

import axios from 'axios';
import type { RegistroPayload } from '@/components/types/registro';

const apiHost = (process.env.API_HOST ?? '').replace(/\/+$/, ''); // http://localhost:8000

export async function registrarSolicitud(payload: RegistroPayload) {
  const url = `${apiHost}/functionality/administradores-negocio/`; // EXACTO, con slash final
  try {
    console.log('[registrarSolicitud] POST ->', url);
    const { data, status } = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    });

    if (status >= 200 && status < 300) {
      console.log('[registrarSolicitud] OK', status);
      return { ok: true, data, status };
    }

    const errorText =
      (typeof data === 'string' && data) ||
      data?.message || data?.detail || JSON.stringify(data || {});
    console.error('[registrarSolicitud] FAIL', status, errorText);
    return { ok: false, status, error: errorText || 'Error desconocido' };
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const data = err?.response?.data;
    const errorText =
      (typeof data === 'string' && data) ||
      data?.message || data?.detail || err?.message || 'Error interno';
    console.error('[registrarSolicitud] EXCEPTION', status, errorText);
    return { ok: false, status, error: errorText };
  }
}
