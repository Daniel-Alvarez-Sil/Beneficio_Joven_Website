// actions/administradores/get-estadisticas-header.ts
'use server'

/**
 * Módulo: get-estadisticas-header
 * Descripción: Server Action que obtiene las estadísticas del encabezado (header) desde el backend.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1. Registra en consola que iniciará la obtención de estadísticas.
 * 2. Usa `withAuthRetry` para ejecutar una petición GET autenticada con Bearer Token.
 * 3. Si el wrapper no marca error, retorna el resultado tal cual.
 * 4. En caso contrario, registra el error y retorna `false`.
 *
 * Notas:
 * - Requiere la variable de entorno `API_HOST`.
 * - Endpoint llamado: `/functionality/estadisticas/header/`
 * - Autenticación: Bearer token inyectado por `withAuthRetry`.
 */

import axios from 'axios'
import { withAuthRetry } from '@/lib/login/auth-wrapper'

const apiHost = process.env.API_HOST;

export async function getEstadisticasHeader() {
  // 1) Log informativo: inicio de la operación
  console.log("Fetching header statistics...");

  // 2) Llamada autenticada al endpoint usando el token provisto por withAuthRetry
  const result = await withAuthRetry((token) =>
    axios.get(`${apiHost}/functionality/estadisticas/header/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  );

  // 3) Si no hay marca de error en el wrapper, regresamos el resultado tal cual
  if (result && !(result as any).error) {
    return result;
  }

  // 4) Manejo simple de error: log y retorno estándar `false`
  console.error('Error fetching sales data:', result);
  return false;
}
