import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { sessionSecret } from './config'

/** Single-user mode (JSON storage): password from env + HMAC-signed session cookie. */

export const PASSWORD_SESSION_TTL = 7 * 24 * 60 * 60 // seconds

const b64url = (s: string | Buffer) => Buffer.from(s).toString('base64url')
const sign = (payload: string) => createHmac('sha256', sessionSecret()).update(payload).digest('base64url')

export function checkPassword(input: string): boolean {
  const expected = process.env.LEDGER_PASSWORD
  if (!expected) return false
  // Hash first so timingSafeEqual gets equal-length buffers and length isn't leaked.
  const a = createHash('sha256').update(input).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

export function createSessionToken(): string {
  const payload = b64url(JSON.stringify({ sub: 'owner', exp: Math.floor(Date.now() / 1000) + PASSWORD_SESSION_TTL }))
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp: number }
    return typeof exp === 'number' && exp > Date.now() / 1000
  } catch {
    return false
  }
}
