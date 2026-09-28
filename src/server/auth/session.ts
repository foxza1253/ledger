import { cookies } from 'next/headers'
import { ApiError } from '../errors'
import {
  SB_ACCESS_COOKIE, SB_REFRESH_COOKIE, SESSION_COOKIE, cookieOptions, getAuthMode,
} from './config'
import { PASSWORD_SESSION_TTL, createSessionToken, verifySessionToken } from './password-session'
import { readJwtClaims, refreshSession, signOut, type SupabaseTokens } from './supabase-auth'

export interface Session {
  mode: 'supabase' | 'password' | 'disabled'
  userId: string
  email?: string
  /** Supabase user JWT — forwarded to PostgREST so RLS applies. */
  accessToken?: string
}

const REFRESH_TTL = 30 * 24 * 60 * 60
const REFRESH_EARLY_SEC = 60

/**
 * Pages fire several API calls at once. Supabase rotates refresh tokens, so if each
 * request refreshed on its own, all but the first would fail and log the user out.
 * Share one in-flight refresh per refresh token (per server process).
 */
const inflightRefresh = new Map<string, Promise<SupabaseTokens | null>>()

function refreshOnce(refreshToken: string): Promise<SupabaseTokens | null> {
  let p = inflightRefresh.get(refreshToken)
  if (!p) {
    p = refreshSession(refreshToken)
    inflightRefresh.set(refreshToken, p)
    // Keep the result briefly so requests that arrive just after still reuse it.
    // 10s matches Supabase's default refresh-token reuse interval, so this doesn't
    // widen the replay window beyond what Supabase already allows.
    setTimeout(() => inflightRefresh.delete(refreshToken), 10_000).unref?.()
  }
  return p
}

type CookieStore = Awaited<ReturnType<typeof cookies>>

function storeSupabaseTokens(store: CookieStore, t: SupabaseTokens) {
  store.set(SB_ACCESS_COOKIE, t.access_token, cookieOptions(REFRESH_TTL))
  store.set(SB_REFRESH_COOKIE, t.refresh_token, cookieOptions(REFRESH_TTL))
}

export async function startSupabaseSession(t: SupabaseTokens) {
  storeSupabaseTokens(await cookies(), t)
}

export async function startPasswordSession() {
  ;(await cookies()).set(SESSION_COOKIE, createSessionToken(), cookieOptions(PASSWORD_SESSION_TTL))
}

export async function endSession() {
  const store = await cookies()
  const access = store.get(SB_ACCESS_COOKIE)?.value
  if (access && getAuthMode() === 'supabase') await signOut(access)
  for (const name of [SESSION_COOKIE, SB_ACCESS_COOKIE, SB_REFRESH_COOKIE]) store.delete(name)
}

/** Resolves the current session from cookies; refreshes an expiring Supabase token. */
export async function getSession(): Promise<Session | null> {
  const mode = getAuthMode()
  if (mode === 'disabled') return { mode, userId: 'owner' }

  const store = await cookies()
  if (mode === 'password') {
    return verifySessionToken(store.get(SESSION_COOKIE)?.value) ? { mode, userId: 'owner' } : null
  }

  let access = store.get(SB_ACCESS_COOKIE)?.value
  const refresh = store.get(SB_REFRESH_COOKIE)?.value
  let claims = access ? readJwtClaims(access) : null

  const now = Date.now() / 1000
  const expiring = !claims?.exp || claims.exp - now < REFRESH_EARLY_SEC
  if (expiring && refresh) {
    const t = await refreshOnce(refresh)
    if (t) {
      storeSupabaseTokens(store, t)
      access = t.access_token
      claims = readJwtClaims(access)
    }
    // On failure keep going with the current access token if it is still valid;
    // don't delete cookies — a concurrent request may have just stored fresh ones.
  }
  if (!claims?.exp || claims.exp <= now) return null
  if (!access || !claims?.sub) return null
  return { mode, userId: claims.sub, email: claims.email, accessToken: access }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new ApiError(401, 'กรุณาเข้าสู่ระบบ')
  return session
}
