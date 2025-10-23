// actions/colaboradores/editar-promocion.ts
'use server'

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
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData
  const body = isFormData ? (payload as FormData) : toFormData(payload as Record<string, any>)

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

  return result && !(result as any).error
}
