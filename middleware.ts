import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Protects /dashboard/* only. Public marketing + /product/* stay open.
 * Do not redirect /login → /dashboard here (stale cookies caused redirect loops).
 * Login/signup pages validate the session client-side via /api/auth/me.
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isDashboardPath = path.startsWith('/dashboard')
  const token = request.cookies.get('access_token')?.value?.trim() || ''

  if (isDashboardPath && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
