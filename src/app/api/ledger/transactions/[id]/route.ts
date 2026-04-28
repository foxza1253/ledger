import { NextRequest } from 'next/server'
import { readJson, writeJson } from '@/lib/json-store'
import { getMonthKey } from '@/lib/date'
import type { MonthlyFile, UpdateTransactionInput } from '@/common/type/interface'

type Ctx = { params: Promise<{ id: string }> }

async function findTransaction(id: string, date?: string) {
  if (date) {
    const [yearStr, monthStr] = date.split('-')
    const key = getMonthKey(parseInt(yearStr), parseInt(monthStr))
    const file = await readJson<MonthlyFile>(`transactions/${key}.json`)
    const txn = file?.transactions.find((t) => t.id === id)
    if (txn) return { file, key, txn }
  }
  return null
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const date = request.nextUrl.searchParams.get('date') ?? ''
  const result = await findTransaction(id, date)
  if (!result) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ transaction: result.txn })
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const date = request.nextUrl.searchParams.get('date') ?? ''
  const result = await findTransaction(id, date)
  if (!result) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = (await request.json()) as UpdateTransactionInput
  const updated = {
    ...result.txn,
    ...body,
    id,
    updatedAt: new Date().toISOString(),
  }

  const newTransactions = result.file!.transactions.map((t) => (t.id === id ? updated : t))
  await writeJson(`transactions/${result.key}.json`, {
    ...result.file,
    transactions: newTransactions,
  })

  return Response.json({ transaction: updated })
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const date = request.nextUrl.searchParams.get('date') ?? ''
  const result = await findTransaction(id, date)
  if (!result) return Response.json({ error: 'Not found' }, { status: 404 })

  const newTransactions = result.file!.transactions.filter((t) => t.id !== id)
  await writeJson(`transactions/${result.key}.json`, {
    ...result.file,
    transactions: newTransactions,
  })

  return Response.json({ success: true })
}
