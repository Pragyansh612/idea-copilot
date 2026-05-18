import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.cookies.get('ic-auth')?.value
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/dashboard') && auth !== '1') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (pathname === '/login' && auth === '1') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}