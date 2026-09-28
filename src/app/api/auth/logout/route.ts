import { handle } from '@/server/errors'
import { endSession } from '@/server/auth/session'

export function POST() {
  return handle(async () => {
    await endSession()
    return Response.json({ ok: true })
  })
}
