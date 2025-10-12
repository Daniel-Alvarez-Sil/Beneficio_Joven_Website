import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyRole } from './lib/login/dal'
 
// 1. Specify protected and public routes
// const protectedRoutes = ['/dashboard', '/prayers']
const publicRoutes = ['/registro', '/registro/colaborador', '/registro/negocio', '/negocio']
 
export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname
  // const isProtectedRoute = protectedRoutes.includes(path)
  const isPublicRoute = publicRoutes.includes(path)
 
  // 3. Decrypt the session from the cookie
  let session = null
  const cookieValue = (await cookies()).get('session')?.value

  if (cookieValue) {
    try {
        session = JSON.parse(cookieValue)
    } catch (err) {
        console.error('Invalid session cookie:', err)
    }
  }
 
  // 4. Redirect to /login if the user is not authenticated
  if (!isPublicRoute && !session?.accessToken) {
    return NextResponse.redirect(new URL('/registro', req.nextUrl))
  }
 
  // 5. Redirect to /dashboard if the user is authenticated
  if (
    isPublicRoute &&
    session?.accessToken 
    // && 
    // !req.nextUrl.pathname.startsWith('/')
  ) {
    const role = await verifyRole()
    if (role?.role === 'colaborador')
      return NextResponse.redirect(new URL('/colaborador', req.nextUrl))
    return NextResponse.redirect(new URL('/negocio', req.nextUrl))

  }
 
  return NextResponse.next()
}
 
// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}