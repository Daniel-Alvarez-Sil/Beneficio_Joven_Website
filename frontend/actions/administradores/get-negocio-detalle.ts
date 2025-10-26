// actions/administradores/get-negocio-detalle.ts
'use server'

/**
 * Módulo: get-negocio-detalle
 * Descripción: Server Action que obtiene el detalle de un negocio específico desde el backend.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Parámetros:
 * - id_negocio (number): Identificador numérico del negocio cuyo detalle se requiere.
 *
 * Flujo:
 * 1) Log inicial para trazar la solicitud.
 * 2) Usa `withAuthRetry` para inyectar el Bearer token y realizar la petición GET autenticada.
 * 3) Si el wrapper indica error o no hay resultado, lanza excepción controlada.
 * 4) Log del resultado y retorno del objeto `result` tal cual lo provee el wrapper/axios.
 *
 * Notas:
 * - Requiere `API_HOST` en variables de entorno.
 * - Endpoint llamado: `/functionality/negocio/detalle/?id_negocio={id}`
 * - Autenticación: encabezado `Authorization: Bearer <token>`
 */

import axios from "axios"
import { withAuthRetry } from '@/lib/login/auth-wrapper';

const apiHost = process.env.API_HOST;

export async function getNegocioDetalle(id_negocio: number) {
  // 1) Log informativo para seguimiento en servidor
  console.log("Vamos por negocio detalle");

  // 2) Llamada autenticada al endpoint con el token proporcionado por withAuthRetry
  const result = await withAuthRetry((token) =>
    axios.get(`${apiHost}/functionality/negocio/detalle/?id_negocio=${id_negocio}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );

  // 3) Validación de error: si no hay resultado o el wrapper marcó `.error`, lanzamos excepción
  if (!result || (result as any).error) {
    throw new Error("Error fetching negocio detalle");
  }

  // 4) Log del resultado y retorno transparente
  console.log("Negocio detalle result:", result);
  return result;
}
