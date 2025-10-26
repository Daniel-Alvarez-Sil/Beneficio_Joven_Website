// actions/administradores/get-solicitudes.ts
'use server'

/**
 * Módulo: get-solicitudes
 * Descripción: Server Action que obtiene la lista de solicitudes de negocio desde el backend.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Usa `withAuthRetry` para realizar una petición GET autenticada con Bearer Token.
 * 2) Si no hay error reportado por el wrapper, retorna el `result` tal cual.
 * 3) Si ocurre un error, se registra en consola y se retorna `false`.
 *
 * Notas:
 * - Requiere `API_HOST` configurado en variables de entorno.
 * - Endpoint llamado: `/functionality/solicitudes-negocio/list/`
 * - Autenticación: `Authorization: Bearer <token>` inyectado por `withAuthRetry`.
 */

import axios from 'axios'
import { withAuthRetry } from '@/lib/login/auth-wrapper'

const apiHost = process.env.API_HOST;

export async function getSolicitudes() {
  const result = await withAuthRetry((token) =>
    axios.get(`${apiHost}/functionality/solicitudes-negocio/list/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  );

  if (result && !(result as any).error) {
    return result;
  }

  console.error('Error fetching sales data:', result);
  return false;
}
