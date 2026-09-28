import { api } from '@/lib/api-client'
import type { Categories, Category, CategoryType } from '@/common/type/interface'

export async function fetchCategories(): Promise<Categories> {
  return (await api<{ categories: Categories }>('/categories')).categories
}

export async function createCategory(type: CategoryType, payload: Omit<Category, 'id'>): Promise<Categories> {
  return (await api<{ categories: Categories }>('/categories', { method: 'POST', body: { type, ...payload } })).categories
}

export async function updateCategory(id: string, payload: Partial<Omit<Category, 'id'>>): Promise<Categories> {
  return (await api<{ categories: Categories }>(`/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: payload })).categories
}

export async function deleteCategory(id: string): Promise<Categories> {
  return (await api<{ categories: Categories }>(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' })).categories
}
