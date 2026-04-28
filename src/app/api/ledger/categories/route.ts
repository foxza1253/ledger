import { NextRequest } from 'next/server'
import { readJson, writeJson } from '@/lib/json-store'
import type { Categories, Category } from '@/common/type/interface'

function generateId(): string {
  return 'cat_' + Math.random().toString(36).slice(2, 8)
}

export async function GET() {
  const categories = await readJson<Categories>('categories.json')
  if (!categories) {
    return Response.json({ error: 'categories not found' }, { status: 404 })
  }
  return Response.json({ categories })
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { type: 'income' | 'expense'; name: string; icon: string; color: string }

  if (!body.type || !body.name || !body.icon || !body.color) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const categories = await readJson<Categories>('categories.json')
  if (!categories) return Response.json({ error: 'not found' }, { status: 404 })

  const newCat: Category = { id: generateId(), name: body.name, icon: body.icon, color: body.color }
  const updated: Categories = {
    ...categories,
    [body.type]: [...categories[body.type], newCat],
  }

  await writeJson('categories.json', updated)
  return Response.json({ category: newCat, categories: updated }, { status: 201 })
}
