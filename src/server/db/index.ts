import type { Session } from '../auth/session'
import type { DbProvider, LedgerRepository } from './types'
import { jsonRepository } from './json/json-repository'
import { createSupabaseRepository } from './supabase/supabase-repository'

export function getDbProvider(): DbProvider {
  const p = (process.env.LEDGER_DB_PROVIDER ?? 'json').toLowerCase()
  if (p === 'json' || p === 'supabase') return p
  throw new Error(`Unknown LEDGER_DB_PROVIDER "${p}" (expected "json" or "supabase")`)
}

/**
 * Storage for the signed-in user. Supabase repositories are per-request and carry the
 * user's JWT, so Postgres RLS scopes every query to that user.
 */
export function getRepository(session: Session): LedgerRepository {
  if (getDbProvider() === 'supabase') {
    if (!session.accessToken) throw new Error('Supabase provider requires a Supabase session')
    return createSupabaseRepository(session.accessToken)
  }
  return jsonRepository
}

export type { LedgerRepository } from './types'
