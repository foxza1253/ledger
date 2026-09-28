import { supabaseConfig } from './config'

/** Thin client for Supabase Auth (GoTrue) REST endpoints. */

export interface SupabaseTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  user: { id: string; email?: string }
}

async function gotrue<T>(path: string, init: { method?: string; body?: unknown; accessToken?: string }): Promise<{ ok: boolean; status: number; data: T }> {
  const { url, apiKey } = supabaseConfig()
  const headers: Record<string, string> = { apikey: apiKey, 'Content-Type': 'application/json' }
  if (init.accessToken) headers.Authorization = `Bearer ${init.accessToken}`
  const res = await fetch(`${url}/auth/v1${path}`, {
    method: init.method ?? 'POST',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, data: (text ? JSON.parse(text) : null) as T }
}

export async function signInWithPassword(email: string, password: string): Promise<SupabaseTokens | null> {
  const r = await gotrue<SupabaseTokens>('/token?grant_type=password', { body: { email, password } })
  return r.ok ? r.data : null
}

export async function refreshSession(refreshToken: string): Promise<SupabaseTokens | null> {
  const r = await gotrue<SupabaseTokens>('/token?grant_type=refresh_token', { body: { refresh_token: refreshToken } })
  return r.ok ? r.data : null
}

export async function signOut(accessToken: string): Promise<void> {
  await gotrue('/logout', { accessToken }).catch(() => {})
}

/**
 * Reads claims WITHOUT verifying the signature. Only used to decide when to refresh
 * and to display the email — authorization is enforced by PostgREST/RLS, which does
 * verify the JWT on every request.
 */
export function readJwtClaims(token: string): { sub?: string; email?: string; exp?: number } | null {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
  } catch {
    return null
  }
}
