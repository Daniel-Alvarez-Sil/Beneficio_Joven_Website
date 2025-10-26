// actions/administradores/review-solicitud.ts
'use server' 

/**
 * Módulo: review-solicitud
 * Descripción: Server Action que envía al backend la revisión de una solicitud de negocio.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Parámetros:
 * - body: {
 *     id_solicitud: number;   // ID de la solicitud a revisar
 *     estatus: string;         // Estatus recibido desde la UI (e.g., 'rechazada')
 *     observaciones: string;   // Observaciones o comentarios de la revisión
 *   }
 *
 * Flujo:
 * 1) Log inicial para trazar el proceso.
 * 2) Normaliza el estatus: si llega 'rechazada' se envía 'rechazado', en caso contrario 'aprobado'.
 * 3) Registra el cuerpo final que se enviará.
 * 4) Usa `withAuthRetry` para POST autenticado al endpoint de revisión.
 * 5) Retorna `true` si no hay error reportado por el wrapper; `false` en caso contrario.
 *
 * Notas:
 * - Requiere variable de entorno `API_HOST`.
 * - Endpoint: `/functionality/solicitudes-negocio/review/`
 * - Autenticación: `Authorization: Bearer <token>` provisto por `withAuthRetry`.
 */

import axios from "axios" 

import { withAuthRetry } from '@/lib/login/auth-wrapper';

const apiHost = process.env.API_HOST;

export async function reviewSolicitud(body: { id_solicitud: number; estatus: string; observaciones: string }) {
  console.log("Vamos por solicitudes");
  if (body.estatus=== 'rechazada'){
    body.estatus = 'rechazado';
  } else {
    body.estatus = 'aprobado';
  }
  console.log(body);
  const result = await withAuthRetry((token) =>
    axios.post(`${apiHost}/functionality/solicitudes-negocio/review/`, body, { headers: { Authorization: `Bearer ${token}` } })
  );
  return result && !(result as any).error; // Return true if no error, false otherwise
}
