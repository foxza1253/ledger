import { NextRequest } from 'next/server'
import { readJson, writeJson } from '@/lib/json-store'
import type { Settings } from '@/common/type/interface'

export async function GET() {
  const settings = await readJson<Settings>('settings.json')
  if (!settings) {
    return Response.json({ error: 'settings not found' }, { status: 404 })
  }
  return Response.json({ settings })
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as Partial<Settings>
  const current = await readJson<Settings>('settings.json')
  const updated = { ...current, ...body }
  await writeJson('settings.json', updated)
  return Response.json({ settings: updated })
}
