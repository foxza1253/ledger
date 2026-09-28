import { NextRequest } from 'next/server'
import { readBody } from '@/server/errors'
import { authed } from '@/server/route'
import { createCategory, listCategories } from '@/server/services/category.service'

export function GET() {
  return authed(async (session) => Response.json({ categories: await listCategories(session) }))
}

export function POST(request: NextRequest) {
  return authed(async (session) => {
    const category = await createCategory(session, await readBody(request))
    return Response.json({ category, categories: await listCategories(session) }, { status: 201 })
  })
}
