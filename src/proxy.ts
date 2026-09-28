import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAMES, getAuthMode } from '@/server/auth/config'

/**
 * First line of defence (Next 16 "proxy", formerly middleware):
 *  - blocks cross-site state-changing API calls (CSRF) by checking Origin
 *  - sends visitors without a session cookie to /login
 * It only checks that a cookie is present; every API route still verifies the
 * session itself, and with Supabase the database enforces RLS on top.
 */

const PUBLIC_PAGES = ['/login']
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) {
    // Browsers always send Origin on cross-site fetch/form POSTs; fall back to Sec-Fetch-Site.
    const site = request.headers.get('sec-fetch-site')
    return !site || site === 'same-origin' || site === 'none'
  }
  try {
    return new URL(origin).host === request.headers.get('host')
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isApi = pathname.startsWith('/api/')

  if (isApi && MUTATING.has(request.method) && !sameOrigin(request)) {
    return NextResponse.json({ error: 'คำขอข้ามโดเมนไม่ได้รับอนุญาต' }, { status: 403 })
  }

  if (getAuthMode() === 'disabled') return NextResponse.next()
  if (pathname.startsWith('/api/auth/') || PUBLIC_PAGES.includes(pathname)) return NextResponse.next()

  const hasSession = SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name))
  if (hasSession) return NextResponse.next()

  if (isApi) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
  const login = new URL('/login', request.url)
  if (pathname !== '/') login.searchParams.set('next', pathname + search)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|webp|ico)$).*)'],
}
