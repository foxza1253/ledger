import { requireSession, type Session } from './auth/session'
import { handle } from './errors'

/** Route body that requires a signed-in user (401 otherwise). */
export function authed(fn: (session: Session) => Promise<Response>): Promise<Response> {
  return handle(async () => fn(await requireSession()))
}
