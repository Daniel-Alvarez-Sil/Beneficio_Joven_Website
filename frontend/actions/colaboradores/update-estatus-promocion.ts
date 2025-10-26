// actions/colaboradores/update-estatus-promocion.ts
'use server'

/**
 * Módulo: actions/colaboradores/update-estatus-promocion
 * Descripción: Server Action para cambiar el estatus de una promoción existente.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Registra en consola el inicio del cambio de estatus.
 * 2) Envía un POST autenticado a `/functionality/promociones/update/` con `{ id_promocion: id }`.
 * 3) Retorna `true` si el wrapper no reporta error; `false` en caso contrario.
 *
 * Notas:
 * - Requiere la variable de entorno `API_HOST`.
 * - Autenticación: `Authorization: Bearer <token>` inyectado por `withAuthRetry`.
 */

import axios from "axios"
import { withAuthRetry } from '@/lib/login/auth-wrapper'

const apiHost = process.env.API_HOST;

export async function cambiarEstatusPromocion(id: number) {
  console.log("Cambio de estatus de promocion");

  const result = await withAuthRetry((token) =>
    axios.post(`${apiHost}/functionality/promociones/update/`, {id_promocion: id}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  );

  return result && !(result as any).error; // Return true if no error, false otherwise
}
