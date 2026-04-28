import type { Categories, Category } from '@/common/type/interface'

export async function fetchCategories(): Promise<Categories | null> {
  const res = await fetch('/api/ledger/categories')
  if (!res.ok) return null
  const data = await res.json()
  return data.categories ?? null
}

export async function createCategory(
  type: 'income' | 'expense',
  payload: Omit<Category, 'id'>
): Promise<Categories> {
  const res = await fetch('/api/ledger/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...payload }),
  })
  const data = await res.json()
  return data.categories
}

export async function updateCategory(
  id: string,
  payload: Partial<Omit<Category, 'id'>>
): Promise<Categories> {
  const res = await fetch(`/api/ledger/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  return data.categories
}

export async function deleteCategory(id: string): Promise<Categories> {
  const res = await fetch(`/api/ledger/categories/${id}`, { method: 'DELETE' })
  const data = await res.json()
  return data.categories
}
