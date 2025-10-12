// actions/colaboradores/registro_solicitud.ts
'use server';

import axios from 'axios';
import { withAuthRetry } from '@/lib/login/auth-wrapper';
import type { RegistroPayload } from '@/components/types/registro';

const apiHost = process.env.API_HOST;

export async function registrarSolicitud(payload: RegistroPayload) {
  try {
    const result = await withAuthRetry((token) =>
      axios.post(`${apiHost}/functionality/administradores-negocio/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    return { ok: true, data: (result as any)?.data ?? null };
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ??
      err?.response?.data?.detail ??
      err?.message ?? 'Error interno del servidor';
    return { ok: false, error: msg, status: err?.response?.status ?? 500 };
  }
}
