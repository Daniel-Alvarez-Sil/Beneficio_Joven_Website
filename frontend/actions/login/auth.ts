'use server'

import { redirect } from 'next/navigation'
import axios from 'axios'
import { SignupFormSchema, LoginFormState } from '@/lib/definitions'
import { createSession, deleteSession } from '@/lib/login/session'

const apiHost = process.env.API_HOST
const ALLOWED_REDIRECTS = new Set<string>(['/colaborador', '/negocio'])

export async function signup(
  _state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validated = SignupFormSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { username, password } = validated.data

  try {
    const response = await axios.post(`${apiHost}/login/login/`, { username, password })
    const data = response.data

    await createSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
      role: data.tipo,
    })

    const requested = (formData.get('redirectTo') as string) || '/'
    const dest = ALLOWED_REDIRECTS.has(requested) ? requested : '/'

    return { success: true, redirectTo: dest }
  } catch (error: any) {
    if (error?.response) {
      const message =
        error.response?.data?.detail || error.response?.statusText || 'Login failed'
      return { errors: { general: [message] } }
    }
    return { errors: { general: ['Unknown error occurred.'] } }
  }
}

export async function logout() {
  await deleteSession()
  redirect('/registro') // ó a donde quieras mandar al usuario

}
