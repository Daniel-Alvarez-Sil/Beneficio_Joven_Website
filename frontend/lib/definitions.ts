// lib/definitios.ts

/**
 * Módulo: lib/definitios
 * Descripción: Esquemas y tipos para validar el formulario de registro/inicio de sesión.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Contenido:
 * - `SignupFormSchema`: Validación con Zod para `username` y `password`.
 * - `LoginFormState`: Tipo de estado que puede contener errores de validación/mensaje
 *   o un flag de éxito.
 *
 * Notas:
 * - No se modifica la lógica original; solo se añaden comentarios de documentación.
 */

import { z } from 'zod'

export const SignupFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: 'El nombre de usuario debe tener minimo dos caracteres.' })
    .trim(),
  password: z
    .string()
    .min(8, { message: 'Contener 8 caracteres mínimo.' })
    .trim(),
})
 
export type LoginFormState =
  | {
      errors?: {
        username?: string[]
        password?: string[]
        general?: string[]
      }
      message?: string
    }
  | undefined |
  {
    success: boolean
  }
