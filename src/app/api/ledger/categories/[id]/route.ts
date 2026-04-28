import { NextRequest } from 'next/server'
import { readJson, writeJson } from '@/lib/json-store'
import type { Categories } from '@/common/type/interface'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const body = await request.json() as { name?: string; icon?: string; color?: string }

  const categories = await readJson<Categories>('categories.json')
  if (!categories) return Response.json({ error: 'not found' }, { status: 404 })

  let found = false
  const updated: Categories = {
    income: categories.income.map((c) => {
      if (c.id === id) { found = true; return { ...c, ...body } }
      return c
    }),
    expense: categories.expense.map((c) => {
      if (c.id === id) { found = true; return { ...c, ...body } }
      return c
    }),
  }

  if (!found) return Response.json({ error: 'Not found' }, { status: 404 })
  await writeJson('categories.json', updated)
  return Response.json({ categories: updated })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params

  const categories = await readJson<Categories>('categories.json')
  if (!categories) return Response.json({ error: 'not found' }, { status: 404 })

  const updated: Categories = {
    income: categories.income.filter((c) => c.id !== id),
    expense: categories.expense.filter((c) => c.id !== id),
  }

  await writeJson('categories.json', updated)
  return Response.json({ categories: updated })
}
