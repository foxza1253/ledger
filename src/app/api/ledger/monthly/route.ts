import { NextRequest } from 'next/server'
import { readJson } from '@/lib/json-store'
import { getMonthKey } from '@/lib/date'
import type { MonthlyFile, MonthlySummary } from '@/common/type/interface'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const year = parseInt(searchParams.get('year') ?? '')
  const month = parseInt(searchParams.get('month') ?? '')

  if (!year || !month) {
    return Response.json({ error: 'year and month are required' }, { status: 400 })
  }

  const key = getMonthKey(year, month)
  const file = await readJson<MonthlyFile>(`transactions/${key}.json`)
  const transactions = file?.transactions ?? []

  let totalIncome = 0
  let totalExpense = 0
  const categoryMap = new Map<string, number>()
  const dailyMap = new Map<string, { income: number; expense: number }>()

  for (const t of transactions) {
    if (t.type === 'income') totalIncome += t.amount
    else totalExpense += t.amount

    categoryMap.set(t.categoryId, (categoryMap.get(t.categoryId) ?? 0) + t.amount)

    const existing = dailyMap.get(t.date) ?? { income: 0, expense: 0 }
    if (t.type === 'income') existing.income += t.amount
    else existing.expense += t.amount
    dailyMap.set(t.date, existing)
  }

  const summary: MonthlySummary = {
    year,
    month,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory: Array.from(categoryMap.entries()).map(([categoryId, total]) => ({
      categoryId,
      total,
    })),
    dailyBreakdown: Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { income, expense }]) => ({ date, income, expense })),
  }

  return Response.json({ summary })
}
