import { id } from 'date-fns/locale'
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
