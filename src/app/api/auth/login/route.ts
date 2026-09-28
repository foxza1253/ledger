import { NextRequest } from 'next/server'
import { ApiError, badRequest, handle, readBody } from '@/server/errors'
import { getAuthMode } from '@/server/auth/config'
import { checkPassword } from '@/server/auth/password-session'
import { hitRateLimit, resetRateLimit } from '@/server/auth/rate-limit'
import { startPasswordSession, startSupabaseSession } from '@/server/auth/session'
import { signInWithPassword } from '@/server/auth/supabase-auth'

const clientIp = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local'

export function POST(request: NextRequest) {
  return handle(async () => {
    const mode = getAuthMode()
    if (mode === 'disabled') return Response.json({ ok: true })

    const body = await readBody<{ email?: unknown; password?: unknown }>(request)
    const password = typeof body.password === 'string' ? body.password : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!password || password.length > 256 || (mode === 'supabase' && (!email || email.length > 254))) {
      throw badRequest('กรุณากรอกข้อมูลเข้าสู่ระบบให้ครบ')
    }

    const key = `login:${clientIp(request)}:${email}`
    const limit = hitRateLimit(key)
    if (!limit.allowed) {
      return Response.json(
        { error: `พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ ${Math.ceil(limit.retryAfterSec / 60)} นาที` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
      )
    }

    if (mode === 'password') {
      if (!process.env.LEDGER_PASSWORD) throw new ApiError(500, 'ยังไม่ได้ตั้งค่า LEDGER_PASSWORD ใน .env.local')
      if (!checkPassword(password)) throw new ApiError(401, 'รหัสผ่านไม่ถูกต้อง')
      await startPasswordSession()
    } else {
      const tokens = await signInWithPassword(email, password)
      // Same message for unknown email / wrong password — don't reveal which accounts exist.
      if (!tokens) throw new ApiError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      await startSupabaseSession(tokens)
    }
    resetRateLimit(key)
    return Response.json({ ok: true })
  })
}
