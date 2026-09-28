import { NextRequest } from 'next/server'
import { readBody } from '@/server/errors'
import { authed } from '@/server/route'
import { deleteCategory, listCategories, updateCategory } from '@/server/services/category.service'

type Ctx = { params: Promise<{ id: string }> }

export function PUT(request: NextRequest, ctx: Ctx) {
  return authed(async (session) => {
    const { id } = await ctx.params
    const category = await updateCategory(session, id, await readBody(request))
    return Response.json({ category, categories: await listCategories(session) })
  })
}

export function DELETE(_request: NextRequest, ctx: Ctx) {
  return authed(async (session) => {
    const { id } = await ctx.params
    await deleteCategory(session, id)
    return Response.json({ categories: await listCategories(session) })
  })
}
