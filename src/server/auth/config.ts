import { randomBytes } from 'crypto'

export type AuthMode = 'supabase' | 'password' | 'disabled'

export const SESSION_COOKIE = 'ledger_session'
export const SB_ACCESS_COOKIE = 'sb_access'
export const SB_REFRESH_COOKIE = 'sb_refresh'

/** Cookie names whose presence means "probably signed in" (checked cheaply in proxy.ts). */
export const SESSION_COOKIE_NAMES = [SESSION_COOKIE, SB_REFRESH_COOKIE]

const isProd = () => process.env.NODE_ENV === 'production'

export function getAuthMode(): AuthMode {
  if ((process.env.LEDGER_DB_PROVIDER ?? 'json').toLowerCase() === 'supabase') return 'supabase'
  if (process.env.LEDGER_AUTH_DISABLED === 'true') {
    if (isProd()) throw new Error('LEDGER_AUTH_DISABLED is not allowed in production')
    return 'disabled'
  }
  return 'password'
}

export function supabaseConfig() {
  const url = process.env.SUPABASE_URL
  // anon / publishable key: identifies the project only — every data request also
  // carries the signed-in user's JWT, and RLS decides what that user may touch.
  const apiKey = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !apiKey) {
    throw new Error('LEDGER_DB_PROVIDER=supabase requires SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY)')
  }
  return { url: url.replace(/\/$/, ''), apiKey }
}

let devSecret: string | undefined

export function sessionSecret(): string {
  const s = process.env.LEDGER_SESSION_SECRET
  if (s && s.length >= 32) return s
  if (isProd()) throw new Error('LEDGER_SESSION_SECRET (>= 32 chars) is required in production')
  // Dev fallback: random per process (sessions reset on restart).
  devSecret ??= randomBytes(32).toString('hex')
  return devSecret
}

export const cookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: 'lax' as const,
  path: '/',
  maxAge: maxAgeSeconds,
})
