import { handle } from '@/server/errors'
import { getAuthMode } from '@/server/auth/config'
import { getSession } from '@/server/auth/session'

export function GET() {
  return handle(async () => {
    const session = await getSession()
    return Response.json({
      mode: getAuthMode(),
      user: session ? { email: session.email ?? null } : null,
    })
  })
}
