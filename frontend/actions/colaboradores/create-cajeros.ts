// /actions/colaboradores/create-cajero.ts
'use server';

import axios from 'axios';
import { withAuthRetry } from '@/lib/login/auth-wrapper';

const apiHost = process.env.API_HOST;

export type NewCajeroPayload = {
  correo: string;
  telefono: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  usuario: string;
  contrasena: string;
  // id_negocio?: number | string; // si el API lo infiere por token, no lo envíes
};

export async function createCajero(payload: NewCajeroPayload) {
  // Devuelve el recurso creado (si el backend lo regresa) o true si sólo te interesa el OK.
  const res = await withAuthRetry((token: string) =>
    axios.post(
      `${apiHost}/functionality/cajero/create/`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  );

  // Si tu wrapper retorna AxiosResponse, saca .data; si no, regresa tal cual.
  if ((res as any)?.data !== undefined) return (res as any).data;
  return res;
}
