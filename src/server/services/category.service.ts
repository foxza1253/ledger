import type { Categories, Category } from '@/common/type/interface'
import type { Session } from '../auth/session'
import { getRepository } from '../db'
import { conflict, notFound } from '../errors'
import { isUuid, validateCreateCategory, validateUpdateCategory } from '../validation'

export function listCategories(session: Session): Promise<Categories> {
  return getRepository(session).categories.list()
}

export async function createCategory(session: Session, body: unknown): Promise<Category> {
  return getRepository(session).categories.create(validateCreateCategory(body))
}

export async function updateCategory(session: Session, id: string, body: unknown): Promise<Category> {
  const patch = validateUpdateCategory(body)
  if (!isUuid(id)) throw notFound('ไม่พบหมวดหมู่นี้')
  const updated = await getRepository(session).categories.update(id, patch)
  if (!updated) throw notFound('ไม่พบหมวดหมู่นี้')
  return updated
}

export async function deleteCategory(session: Session, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound('ไม่พบหมวดหมู่นี้')
  const repo = getRepository(session)
  if (!(await repo.categories.findById(id))) throw notFound('ไม่พบหมวดหมู่นี้')
  const inUse = await repo.transactions.countByCategory(id)
  if (inUse > 0) throw conflict(`ลบไม่ได้ — หมวดหมู่นี้ถูกใช้ใน ${inUse} รายการ`)
  await repo.categories.delete(id)
}
