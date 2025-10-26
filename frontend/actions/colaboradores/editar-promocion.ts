// actions/colaboradores/editar-promocion.ts
'use server'

/**
 * Módulo: editar-promocion
 * Descripción: Server Action para actualizar una promoción existente. Acepta `FormData` (cuando hay archivos)
 * o un objeto plano (que se convierte internamente a `FormData`).
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Si `payload` es objeto, se transforma a `FormData` (texto como string y archivos como `Blob/File`).
 * 2) Se realiza `PUT` autenticado al endpoint `/functionality/promociones/update/complete/{id}/`.
 * 3) No se fija manualmente `Content-Type` cuando se envía `FormData` para permitir el `boundary` correcto.
 * 4) Retorna `true` si no hay error reportado por el wrapper; `false` en caso contrario.
 *
 * Notas:
 * - Requiere la variable de entorno `API_HOST`.
 * - Autenticación: `Authorization: Bearer <token>` provisto por `withAuthRetry`.
 */

import axios from 'axios'
import { withAuthRetry } from '@/lib/login/auth-wrapper'

const apiHost = process.env.API_HOST

// Si te pasan un objeto plano, lo convertimos a FormData
function toFormData(data: Record<string, any>) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    // Files van directo; números/booleanos a string
    if (v instanceof Blob || v instanceof File) fd.append(k, v)
    else fd.append(k, String(v))
  })
  return fd
}

export async function editarPromocion(
  id: number,
  payload: FormData | Record<string, any>
) {
  // Determina si ya recibiste FormData; si no, convierte el objeto a FormData
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData
  const body = isFormData ? (payload as FormData) : toFormData(payload as Record<string, any>)

  // Llamada autenticada al endpoint de actualización completa por ID
  const result = await withAuthRetry((token) =>
    axios.put(
      `${apiHost}/functionality/promociones/update/complete/${id}/`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // ¡NO fijes Content-Type para FormData!
          ...(isFormData ? {} : { /* objeto se convirtió a FD, tampoco poner Content-Type */ }),
        },
      }
    )
  )

  // Retorna `true` si el wrapper no marcó error; `false` en caso contrario
  return result && !(result as any).error
}
