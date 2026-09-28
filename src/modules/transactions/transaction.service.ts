import { api } from '@/lib/api-client'
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@/common/type/interface'

export async function fetchTransactions(
  year: number,
  month: number,
  filters?: { type?: string; categoryId?: string },
  signal?: AbortSignal,
): Promise<Transaction[]> {
  const params = new URLSearchParams({ year: String(year), month: String(month) })
  if (filters?.type) params.set('type', filters.type)
  if (filters?.categoryId) params.set('categoryId', filters.categoryId)
  return (await api<{ transactions: Transaction[] }>(`/transactions?${params}`, { signal })).transactions
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  return (await api<{ transaction: Transaction }>('/transactions', { method: 'POST', body: input })).transaction
}

export async function updateTransaction(id: string, date: string, input: UpdateTransactionInput): Promise<Transaction> {
  const q = new URLSearchParams({ date })
  return (await api<{ transaction: Transaction }>(`/transactions/${encodeURIComponent(id)}?${q}`, { method: 'PUT', body: input })).transaction
}

export async function deleteTransaction(id: string, date: string): Promise<void> {
  const q = new URLSearchParams({ date })
  await api(`/transactions/${encodeURIComponent(id)}?${q}`, { method: 'DELETE' })
}
