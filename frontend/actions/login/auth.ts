'use server'

import axios from 'axios'
import { redirect } from 'next/navigation'

import { SignupFormSchema, LoginFormState } from '@/lib/definitions'
import { createSession, deleteSession } from '@/lib/login/session'
const apiHost = process.env.API_HOST;


export async function signup(state: LoginFormState, formData: FormData) {
  // 1. Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { username, password } = validatedFields.data

  let boolLogin:boolean = false

  try {
    const response = await axios.post(`${apiHost}/seguridad/login/`, {
      username,
      password,
    })

    const data = response.data
    await createSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
        role: data.rol
      })

    console.log("Se logro el login gentee")
    boolLogin = true
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.detail || error.response?.statusText || 'Login failed'

      return {
        errors: {
          general: [message],
        },
      }
    }

    return {
      errors: {
        general: ['Unknown error occurred.'],
      },
    }
  }

  // if (boolLogin) {
  //   redirect("/")
  // }
  return { success: boolLogin }

}
 
export async function logout() {
  await deleteSession()
  console.log("Se logro el logout gentee")
}