// /actions/colaboradores/create-cajeros.ts
'use server';

/**
 * Módulo: create-cajeros
 * Descripción: Server Action para crear un cajero asociado al negocio autenticado.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Detalles:
 * - Usa `withAuthRetry` para inyectar el Bearer token y manejar reintentos de autenticación.
 * - Envía un POST a `/functionality/cajero/create/` con el payload recibido.
 * - Si el wrapper regresa un `AxiosResponse`, devuelve `res.data`; de lo contrario devuelve `res` tal cual.
 *
 * Parámetros:
 * - payload: NewCajeroPayload
 *   - correo: string
 *   - telefono: string
 *   - nombre: string
 *   - apellido_paterno: string
 *   - apellido_materno: string
 *   - usuario: string
 *   - contrasena: string
 *   - (opcional) id_negocio: number | string (si el API lo infiere por token, no enviarlo)
 *
 * Retorno:
 * - `any`: El recurso creado (`res.data`) si viene en la respuesta; en otro caso, el objeto `res` tal cual lo regrese el wrapper.
 *
 * Notas:
 * - Requiere la variable de entorno `API_HOST`.
 * - Autenticación: `Authorization: Bearer <token>`.
 */

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
