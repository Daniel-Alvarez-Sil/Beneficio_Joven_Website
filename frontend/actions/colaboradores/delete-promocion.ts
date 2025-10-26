// actions/colaboradores/delete-promocion.ts
'use server'

/**
 * Módulo: delete-promocion
 * Descripción: Server Action para eliminar (borrar) una promoción existente en el backend.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Parámetros:
 * - id (number): Identificador numérico de la promoción a eliminar.
 *
 * Flujo:
 * 1) Registra en consola el inicio del proceso de borrado.
 * 2) Usa `withAuthRetry` para enviar un POST autenticado al endpoint de borrado con `{ id_promocion: id }`.
 * 3) Retorna `true` cuando no hay error reportado por el wrapper; `false` en caso contrario.
 *
 * Notas:
 * - Requiere variable de entorno `API_HOST`.
 * - Endpoint: `/functionality/promociones/delete/`
 * - Autenticación: `Authorization: Bearer <token>` inyectado por `withAuthRetry`.
 */

import axios from "axios"
import { withAuthRetry } from '@/lib/login/auth-wrapper'

const apiHost = process.env.API_HOST;

export async function deletePromocion(id: number) {
  console.log("Borrando promoción");

  const result = await withAuthRetry((token) =>
    axios.post(`${apiHost}/functionality/promociones/delete/`, {id_promocion: id}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  );

  return result && !(result as any).error; // Return true if no error, false otherwise
}
