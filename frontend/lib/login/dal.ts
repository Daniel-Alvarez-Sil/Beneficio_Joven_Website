// DATA ACCESS LAYER (DAL) for session management in Next.js

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
// })

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