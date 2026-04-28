import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@/common/type/interface'

export async function fetchTransactions(
  year: number,
  month: number,
  filters?: { type?: string; categoryId?: string }
): Promise<Transaction[]> {
  const params = new URLSearchParams({ year: String(year), month: String(month) })
  if (filters?.type) params.set('type', filters.type)
  if (filters?.categoryId) params.set('categoryId', filters.categoryId)
  const res = await fetch(`/api/ledger/transactions?${params}`)
  const data = await res.json()
  return data.transactions ?? []
}

export async function fetchTransaction(id: string, date: string): Promise<Transaction | null> {
  const res = await fetch(`/api/ledger/transactions/${id}?date=${date}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.transaction ?? null
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const res = await fetch('/api/ledger/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json()
  return data.transaction
}

export async function updateTransaction(
  id: string,
  date: string,
  input: UpdateTransactionInput
): Promise<Transaction> {
  const res = await fetch(`/api/ledger/transactions/${id}?date=${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json()
  return data.transaction
}

export async function deleteTransaction(id: string, date: string): Promise<void> {
  await fetch(`/api/ledger/transactions/${id}?date=${date}`, { method: 'DELETE' })
}
