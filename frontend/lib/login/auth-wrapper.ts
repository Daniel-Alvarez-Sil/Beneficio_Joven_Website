// lib/login/auth-wrapper.ts
'use server'

/**
 * Módulo: lib/login/auth-wrapper
 * Descripción: Helper para ejecutar llamadas al backend autenticadas con Bearer token,
 *              con reintento automático cuando el token es inválido o expiró.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo de `withAuthRetry`:
 * 1) Obtiene la sesión actual con `verifySession()` y extrae el `token`.
 * 2) Intenta la llamada `apiCall(token)` hasta 2 veces:
 *    - Si la llamada falla con 401 y uno de los mensajes de autenticación conocidos,
 *      intenta refrescar el token con `refreshToken(token)` y reintenta.
 *    - Si no es error de autenticación o ya se usó el reintento, registra el error y retorna `{ error: "Request failed" }`.
 * 3) Si se logra obtener respuesta válida, retorna `response.data`.
 * 4) Si el refresh falla o no hay token válido, retorna un objeto `{ error: ... }`.
 *
 * Notas:
 * - No modifica la firma ni la lógica original; únicamente se documenta.
 * - Los mensajes de error devueltos son genéricos y aptos para consumo por capas superiores.
 */

import { verifySession } from '@/lib/login/dal';
import { refreshToken } from '@/actions/login/refresh-token';

/**
 * Executes an authenticated API call with automatic retry if token is expired/missing.
 * @param apiCall A function that receives a token and returns a Promise of an Axios response
 * @returns The data of the successful response, or an error object
 */
export async function withAuthRetry<T>(apiCall: (token: string) => Promise<{ data: T }>): Promise<T | { error: string }> {
  let token: string | null = null;
  const session = await verifySession();
  token = session?.token || null;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (!token) {
      return { error: "Session is invalid or expired" };
    }

    try {
      const response = await apiCall(token);
      return response.data;
    } catch (error: any) {
      const detail = error.response?.data?.detail;

      const isAuthError =
        error.response?.status === 401 &&
        (detail === "Authentication credentials were not provided." ||
         detail === "Invalid token." ||
         detail === "Token has expired.");

      if (!isAuthError || attempt === 1) {
        console.error("API error:", error);
        return { error: "Request failed" };
      }

      // Try to refresh the token
      const newToken = await refreshToken(token);
      if (!newToken) {
        return { error: "Token refresh failed" };
      }

      token = newToken;
    }
  }

  return { error: "Unexpected retry failure" };
}
