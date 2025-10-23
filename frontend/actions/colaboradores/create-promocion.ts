// actions/colaboradores/create-promocion.ts
'use server'

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
