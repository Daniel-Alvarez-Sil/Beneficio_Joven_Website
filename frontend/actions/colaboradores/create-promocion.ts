// actions/colaboradores/create-promocion.ts
'use server'

/**
 * Módulo: create-promocion
 * Descripción: Server Action para crear una promoción. Acepta tanto `FormData` (cuando se sube imagen/archivo)
 * como un objeto JSON plano (cuando no hay archivo).
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Flujo:
 * 1) Determina si el `payload` es `FormData` (para adjuntar archivos).
 * 2) Registra el `payload` en consola (útil para depuración).
 * 3) Usa `withAuthRetry` para realizar un POST autenticado al endpoint de creación.
 * 4) Si el `payload` es `FormData`, NO fija manualmente el `Content-Type` para permitir el `boundary` correcto.
 * 5) Retorna `true` si no hay error reportado por el wrapper; `false` en caso contrario.
 *
 * Notas:
 * - Requiere variable de entorno `API_HOST`.
 * - Endpoint: `/functionality/promociones/create/`
 * - Autenticación: `Authorization: Bearer <token>` provisto por `withAuthRetry`.
 * - Si hay archivo, enviar `FormData` con los campos requeridos por tu API (p. ej. nombre, descripción, fechas, imagen, etc.).
 */

import axios from 'axios'
import { withAuthRetry } from '@/lib/login/auth-wrapper'
import { log } from 'console'
import { Form } from 'react-hook-form'

const apiHost = process.env.API_HOST

// Acepta FormData (con archivo) o JSON plano (sin archivo)
export async function createPromocion(payload: FormData | Record<string, any>) {
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData
  console.log(payload)
  const result = await withAuthRetry((token) =>
    axios.post(
      `${apiHost}/functionality/promociones/create/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // Importante: NO fijar Content-Type si es FormData para que axios/browsers pongan el boundary
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        },
      }
    )
  )

  return result && !(result as any).error
}
