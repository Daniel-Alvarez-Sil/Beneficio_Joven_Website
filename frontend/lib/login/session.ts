import 'server-only'
import { cookies } from 'next/headers'

// Token structure
type TokenPayload = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  scope: string
  role: number | null
}

const expiresIn: number = 36000; // Default expiration time in seconds

// Create session and store tokens in cookies
export async function createSession(tokens: TokenPayload) {
  'use server'
  const expiresAt = new Date(Date.now() + expiresIn * 1000)
  const cookieStore = await cookies()

  cookieStore.set('session', JSON.stringify(tokens), {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

// Update session by refreshing tokens
export async function updateSession(tokens: TokenPayload) {
  'use server'
  const session = (await cookies()).get('session')?.value 
  if (!session) {
    return null
  }
 
  const expiresAt = new Date(Date.now() + expiresIn * 1000)
 
  const cookieStore = await cookies()
  cookieStore.set('session', JSON.stringify(tokens), {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })

}

// Delete session by clearing cookies
export async function deleteSession() {
  'use server'
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
