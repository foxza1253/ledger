import { monthRange } from '@/lib/date'
import type { Transaction, TransactionType } from '@/common/type/interface'
import type { Session } from '../auth/session'
import { getRepository } from '../db'
import type { LedgerRepository } from '../db/types'
import { badRequest, notFound } from '../errors'
import { isUuid, validateCreateTransaction, validateUpdateTransaction } from '../validation'

async function assertCategoryMatches(repo: LedgerRepository, categoryId: string, type: TransactionType) {
  // With Supabase, RLS hides other users' categories, so they read as "not found".
  const category = await repo.categories.findById(categoryId)
  if (!category) throw badRequest('ข้อมูลไม่ถูกต้อง', { categoryId: 'ไม่พบหมวดหมู่นี้' })
  if (category.type !== type) {
    throw badRequest('ข้อมูลไม่ถูกต้อง', { categoryId: 'หมวดหมู่ไม่ตรงกับประเภทรายการ' })
  }
}

export async function listTransactions(
  session: Session,
  year: number,
  month: number,
  filters: { type?: string | null; categoryId?: string | null } = {},
): Promise<Transaction[]> {
  const { from, to } = monthRange(year, month)
  let list = await getRepository(session).transactions.listByDateRange(from, to)
  if (filters.type) list = list.filter((t) => t.type === filters.type)
  if (filters.categoryId) list = list.filter((t) => t.categoryId === filters.categoryId)
  return list
}

export async function getTransaction(session: Session, id: string, dateHint?: string): Promise<Transaction> {
  if (!isUuid(id)) throw notFound('ไม่พบรายการนี้')
  const txn = await getRepository(session).transactions.findById(id, dateHint)
  if (!txn) throw notFound('ไม่พบรายการนี้')
  return txn
}

export async function createTransaction(session: Session, body: unknown): Promise<Transaction> {
  const input = validateCreateTransaction(body)
  const repo = getRepository(session)
  await assertCategoryMatches(repo, input.categoryId, input.type)
  return repo.transactions.create(input)
}

export async function updateTransaction(session: Session, id: string, body: unknown, dateHint?: string): Promise<Transaction> {
  const patch = validateUpdateTransaction(body)
  const repo = getRepository(session)
  const prev = await getTransaction(session, id, dateHint)
  if (patch.categoryId !== undefined || patch.type !== undefined) {
    await assertCategoryMatches(repo, patch.categoryId ?? prev.categoryId, patch.type ?? prev.type)
  }
  return repo.transactions.update(prev, patch)
}

export async function deleteTransaction(session: Session, id: string, dateHint?: string): Promise<void> {
  const txn = await getTransaction(session, id, dateHint)
  await getRepository(session).transactions.delete(txn)
}
