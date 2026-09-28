import { NextRequest } from 'next/server'
import { readBody } from '@/server/errors'
import { authed } from '@/server/route'
import { getSettings, updateSettings } from '@/server/services/settings.service'

export function GET() {
  return authed(async (session) => Response.json({ settings: await getSettings(session) }))
}

export function PUT(request: NextRequest) {
  return authed(async (session) => Response.json({ settings: await updateSettings(session, await readBody(request)) }))
}
