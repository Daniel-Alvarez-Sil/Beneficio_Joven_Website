// actions/colaboradores/get-cajeros.ts
'use server';

/**
 * Módulo: get-cajeros
 * Descripción: Server Action que obtiene la lista de cajeros asociados al negocio autenticado.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Detalles:
 * - Usa `withAuthRetry` para inyectar el Bearer token y manejar reintentos de autenticación.
 * - Realiza un GET a `/functionality/cajeros/list/`.
 * - Si el wrapper devuelve un `AxiosResponse`, se retorna `res.data`; si ya regresa los datos, se retorna `res` tal cual.
 *
 * Notas importantes:
 * - Campo sensible: `contrasena` llega desde el backend. ⚠️ **No** se debe mostrar en la UI ni registrar en logs.
 * - Requiere la variable de entorno `API_HOST`.
 * - Autenticación: `Authorization: Bearer <token>` provisto por `withAuthRetry`.
 */

import axios from 'axios';
import { withAuthRetry } from '@/lib/login/auth-wrapper';

const apiHost = process.env.API_HOST;

export type Cajero = {
  id: number;
  correo: string;
  telefono: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  usuario: string;
  contrasena: string;    // ⚠️ llega del backend; NO la muestres en UI
  id_negocio: number;
};

export async function getCajeros(): Promise<Cajero[]> {
  console.log("Fetching cajeros...");
  const res = await withAuthRetry((token: string) =>
    axios.get(`${apiHost}/functionality/cajeros/list/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
  console.log("Cajeros fetched:", res);
  // Si tu wrapper devuelve AxiosResponse, usamos .data; si ya regresa data, cae en el segundo return.
  if ((res as any)?.data) return (res as any).data as Cajero[];
  return (res as any) as Cajero[];
}
