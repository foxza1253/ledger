import { NextRequest } from 'next/server'
import { readJson, writeJson } from '@/lib/json-store'
import { getMonthKey } from '@/lib/date'
import type { MonthlyFile, Transaction, CreateTransactionInput } from '@/common/type/interface'

function generateId(): string {
  return 'txn_' + Math.random().toString(36).slice(2, 8)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const year = parseInt(searchParams.get('year') ?? '')
  const month = parseInt(searchParams.get('month') ?? '')
  const type = searchParams.get('type')
  const categoryId = searchParams.get('categoryId')

  if (!year || !month) {
    return Response.json({ error: 'year and month are required' }, { status: 400 })
  }

  const key = getMonthKey(year, month)
  const file = await readJson<MonthlyFile>(`transactions/${key}.json`)
  let transactions: Transaction[] = file?.transactions ?? []

  if (type) transactions = transactions.filter((t) => t.type === type)
  if (categoryId) transactions = transactions.filter((t) => t.categoryId === categoryId)

  transactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return Response.json({ transactions })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateTransactionInput

  if (!body.date || !body.type || !body.categoryId || !body.amount || !body.description) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [yearStr, monthStr] = body.date.split('-')
  const year = parseInt(yearStr)
  const month = parseInt(monthStr)
  const key = getMonthKey(year, month)
  const filePath = `transactions/${key}.json`

  const now = new Date().toISOString()
  const newTransaction: Transaction = {
    ...body,
    id: generateId(),
    note: body.note ?? '',
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  }

  const file = await readJson<MonthlyFile>(filePath)
  const updated: MonthlyFile = {
    year,
    month,
    transactions: [...(file?.transactions ?? []), newTransaction],
  }

  await writeJson(filePath, updated)
  return Response.json({ transaction: newTransaction }, { status: 201 })
}
