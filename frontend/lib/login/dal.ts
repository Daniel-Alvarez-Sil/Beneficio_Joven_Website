// lib/login/dal.ts
// DATA ACCESS LAYER (DAL) for session management in Next.js

/**
 * Módulo: lib/login/dal
 * Descripción: Capa de acceso a datos para gestión de sesión y rol usando cookies en Next.js.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 *
 * Contenido:
 * - `verifySession`: Lee la cookie `session`, valida su formato JSON y, si no existe `accessToken`,
 *   redirige a `/login`. Devuelve un objeto con `{ isAuth, reason, token }`.
 * - `verifyRole`: Lee la cookie `session`, valida su formato JSON y, si no existe `accessToken`,
 *   redirige a `/login`. Devuelve `{ isAuth, reason, role }`.
 *
 * Notas:
 * - Ambas funciones están envueltas en `cache(...)` para memoizar en el ciclo de vida del request.
 * - En caso de cookie inválida (JSON malformado), se retorna un estado de sesión/rol inválido.
 * - La validación remota del token (`validateToken`) está comentada en esta versión.
 */

import 'server-only'
 
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

// import { validateToken } from '@/actions/login/validate-token'
 
// export const verifySession = cache(async () => {
//   'use server'
//   console.log("Verifying session... Starting session verification")
//   let session = null
//   const cookieValue = (await cookies()).get('session')?.value

//   if (cookieValue) {
//     try {
//         console.log("Verifying session...")
//         session = JSON.parse(cookieValue)
//         let validated = await validateToken(session.accessToken)
//         if (!validated) {
//             return { isAuth: false, reason: 'expired', token: session.accessToken }
//         }
//     } catch (err) {
//         console.error('Invalid session cookie:', err)
//         return { isAuth: false, reason: 'invalid', token: null }
//     }
//   }
 
//   if (!session?.accessToken) {
//     redirect('/login')
//   }

//   return { isAuth: true, reason: 'valid', token: session.accessToken }
// })]

// export const verifyRole = cache(async () => {
//   console.log("Verifying role... Starting role verification")
//   let session = null
//   const cookieValue = (await cookies()).get('session')?.value

//   if (cookieValue) {
//     try {
//         console.log("Verifying session...")
//         session = JSON.parse(cookieValue)
//         let validated = await validateToken(session.accessToken)
//         if (!validated) {
//             return { isAuth: false, reason: 'expired', role: session.role }
//         }
//     } catch (err) {
//         console.error('Invalid session cookie:', err)
//         return { isAuth: false, reason: 'invalid', role: null }
//     }
//   }
 
//   if (!session?.accessToken) {
//     redirect('/login')
//   }

//   return { isAuth: true, reason: 'valid', role: session.role }
// })

export const verifySession = cache(async () => {
  'use server'
  console.log("Verifying session... Starting session verification")
  let session = null
  const cookieValue = (await cookies()).get('session')?.value

  if (cookieValue) {
    try {
        session = JSON.parse(cookieValue)
    } catch (err) {
        console.error('Invalid session cookie:', err)
        return { isAuth: false, reason: 'invalid', token: null }
    }
  }
 
  if (!session?.accessToken) {
    redirect('/login')
  }

  return { isAuth: true, reason: 'valid', token: session.accessToken }
})

export const verifyRole = cache(async () => {
  console.log("Verifying role... Starting role verification")
  let session = null
  const cookieValue = (await cookies()).get('session')?.value

  if (cookieValue) {
    try {
        session = JSON.parse(cookieValue)
    } catch (err) {
        console.error('Invalid session cookie:', err)
        return { isAuth: false, reason: 'invalid', role: null }
    }
  }
 
  if (!session?.accessToken) {
    redirect('/login')
  }

  return { isAuth: true, reason: 'valid', role: session.role }
})
