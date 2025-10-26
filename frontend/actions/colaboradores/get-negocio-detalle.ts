// actions/colaboradores/get-negocio-detalle.ts
'use server'

/**
 * Módulo: actions/colaboradores/get-negocio-detalle
 * Descripción: Server Action que obtiene el detalle del negocio asociado al token (sin pasar ID explícito).
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Registra en consola el inicio del proceso.
 * 2) Invoca `withAuthRetry` para realizar una petición GET autenticada al endpoint de detalle.
 * 3) Si el wrapper indica error o no hay resultado, lanza una excepción.
 * 4) Registra en consola el resultado y lo retorna tal cual.
 *
 * Notas:
 * - Requiere `API_HOST` como variable de entorno.
 * - Endpoint: `/functionality/negocio/detalle/`
 * - Autenticación: `Authorization: Bearer <token>` generado por `withAuthRetry`.
 */

import axios from "axios"
import { withAuthRetry } from '@/lib/login/auth-wrapper';

const apiHost = process.env.API_HOST;

export async function getNegocioDetalle() {
  console.log("Vamos por negocio detalle");
  const result = await withAuthRetry((token) =>
    axios.get(`${apiHost}/functionality/negocio/detalle/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );

  if (!result || (result as any).error) {
    throw new Error("Error fetching negocio detalle");
  }

  console.log("Negocio detalle result:", result);
  return result;
}
