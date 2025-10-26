// actions/administradores/get-resumen-negocios.ts
'use server'

/**
 * Módulo: get-resumen-negocios
 * Descripción: Server Action que consulta el resumen de negocios desde el backend.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Invoca `withAuthRetry` para ejecutar una petición GET autenticada con Bearer Token.
 * 2) Si el wrapper no marca error, retorna el `result` tal cual.
 * 3) En caso de error, registra en consola y retorna `false`.
 *
 * Notas:
 * - Requiere variable de entorno `API_HOST`.
 * - Endpoint llamado: `/functionality/negocios/resumen/`
 * - Autenticación: encabezado `Authorization: Bearer <token>` inyectado por `withAuthRetry`.
 */

import axios from 'axios'
import { withAuthRetry } from '@/lib/login/auth-wrapper'

const apiHost = process.env.API_HOST;

export async function getResumenNegocios() {
  // Llamada autenticada al endpoint de resumen de negocios
  const result = await withAuthRetry((token) =>
    axios.get(`${apiHost}/functionality/negocios/resumen/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  );

  // Si el wrapper no marcó error, regresamos el resultado tal cual
  if (result && !(result as any).error) {
    return result;
  }

  // Log de error y retorno estándar `false` para que el caller lo gestione
  console.error('Error fetching sales data:', result);
  return false;
}
