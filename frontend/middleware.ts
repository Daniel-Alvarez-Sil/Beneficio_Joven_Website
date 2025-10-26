// middleware.ts

/**
 * Módulo: Middleware de rutas y sesión (Next.js)
 * Descripción:
 *   Controla el acceso y las redirecciones de la app según:
 *   - La presencia de una sesión (cookie `session` con `accessToken`)
 *   - El tipo de ruta (pública vs. protegida)
 *   - El rol del usuario (`verifyRole`: 'administrador' | 'colaborador')
 *
 * Flujo y reglas:
 *   1) Determina si la ruta actual es pública:
 *        publicRoutes = ['/registro', '/registro/colaborador', '/registro/negocio', '/public']
 *      Todo lo demás se considera protegido (por convención).
 *
 *   2) Lee y decodifica la sesión desde la cookie `session` (JSON.parse). Si es inválida,
 *      se ignora la sesión y se continúa como no autenticado.
 *
 *   3) Acceso a rutas protegidas:
 *        - Si NO hay `session?.accessToken`, redirige a `/registro`.
 *
 *   4) Ruta raíz '/':
 *        - Si NO hay sesión → `/registro`.
 *        - Si hay sesión → consulta `verifyRole()`:
 *            rol 'colaborador' → `/colaborador`
 *            cualquier otro rol → `/administrador`
 *
 *   5) Acceso a rutas públicas con sesión activa:
 *        - Si el usuario ya está autenticado y navega a una ruta pública,
 *          se redirige según su rol:
 *            rol 'colaborador' → `/colaborador`
 *            cualquier otro rol → `/administrador`
 *
 *   6) Si ninguna regla de redirección aplica, continúa con `NextResponse.next()`.
 *
 * Seguridad/Notas:
 *   - La cookie `session` se asume firmada y establecida desde el backend; aquí sólo se lee.
 *   - `verifyRole()` debe validar el `accessToken` de forma segura (servidor) antes de confiar en él.
 *   - Evita listar estáticamente rutas protegidas si tu app crece; mantener una lista de públicas
 *     (como aquí) y tratar el resto como protegidas suele escalar mejor.
 *   - El `matcher` excluye assets estáticos, /api y archivos comunes para rendimiento.
 *
 * Extensión:
 *   - Para agregar nuevas rutas públicas, añádelas a `publicRoutes`.
 *   - Si requieres subrutas públicas (e.g. `/public/*`), considera usar `startsWith`.
 *   - Para roles adicionales, ajusta la rama de `verifyRole()` y las redirecciones.
 *
 * Autores:
 * - Yael Sinuhe Grajeda Martinez
 * - Daniel Alvarez Sil
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyRole } from './lib/login/dal'

// 1) Rutas públicas (el resto se considera protegido por convención)
const publicRoutes = ['/registro', '/registro/colaborador', '/registro/negocio', '/public']

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)

  // 2) Intenta leer la sesión desde la cookie 'session'
  let session: any = null
  const cookieValue = (await cookies()).get('session')?.value
  if (cookieValue) {
    try {
      session = JSON.parse(cookieValue)
    } catch (err) {
      console.error('Invalid session cookie:', err)
    }
  }

  // 3) Ruta protegida sin sesión → /registro
  if (!isPublicRoute && !session?.accessToken) {
    return NextResponse.redirect(new URL('/registro', req.nextUrl))
  }

  // 4) Ruta raíz: redirige según sesión/rol
  if (path === '/') {
    if (!session?.accessToken) {
      return NextResponse.redirect(new URL('/registro', req.nextUrl))
    } else {
      const role = await verifyRole()
      if (role?.role === 'colaborador') {
        return NextResponse.redirect(new URL('/colaborador', req.nextUrl))
      }
      return NextResponse.redirect(new URL('/administrador', req.nextUrl))
    }
  }

  // 5) Ruta pública con sesión → redirigir a dashboard según rol
  if (isPublicRoute && session?.accessToken) {
    const role = await verifyRole()
    if (role?.role === 'colaborador') {
      return NextResponse.redirect(new URL('/colaborador', req.nextUrl))
    }
    return NextResponse.redirect(new URL('/administrador', req.nextUrl))
  }

  // 6) Continuar
  return NextResponse.next()
}

// Excluir estáticos, API y archivos comunes del middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.[^/]+$).*)',
  ],
}
