import { addMonths, monthRange } from '@/lib/date'
import type { MonthlySummary, Transaction, TrendPoint } from '@/common/type/interface'
import type { Session } from '../auth/session'
import { getRepository } from '../db'

const round2 = (n: number) => Math.round(n * 100) / 100

export function summarize(year: number, month: number, transactions: Transaction[]): MonthlySummary {
  let totalIncome = 0
  let totalExpense = 0
  const byCategory = new Map<string, MonthlySummary['byCategory'][number]>()
  const daily = new Map<string, { income: number; expense: number }>()

  for (const t of transactions) {
    if (t.type === 'income') totalIncome += t.amount
    else totalExpense += t.amount

    const cat = byCategory.get(t.categoryId) ?? { categoryId: t.categoryId, type: t.type, total: 0, count: 0 }
    cat.total += t.amount
    cat.count += 1
    byCategory.set(t.categoryId, cat)

    const day = daily.get(t.date) ?? { income: 0, expense: 0 }
    day[t.type] += t.amount
    daily.set(t.date, day)
  }

  return {
    year,
    month,
    totalIncome: round2(totalIncome),
    totalExpense: round2(totalExpense),
    balance: round2(totalIncome - totalExpense),
    transactionCount: transactions.length,
    byCategory: [...byCategory.values()]
      .map((c) => ({ ...c, total: round2(c.total) }))
      .sort((a, b) => b.total - a.total),
    dailyBreakdown: [...daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, income: round2(v.income), expense: round2(v.expense) })),
  }
}

export async function getMonthlySummary(session: Session, year: number, month: number): Promise<MonthlySummary> {
  const { from, to } = monthRange(year, month)
  return summarize(year, month, await getRepository(session).transactions.listByDateRange(from, to))
}

/** Totals for the `months` months ending at (year, month), oldest first — one storage query. */
export async function getTrend(session: Session, year: number, month: number, months = 6): Promise<TrendPoint[]> {
  const start = addMonths(year, month, -(months - 1))
  const txns = await getRepository(session).transactions.listByDateRange(
    monthRange(start.year, start.month).from,
    monthRange(year, month).to,
  )
  return Array.from({ length: months }, (_, i) => {
    const m = addMonths(start.year, start.month, i)
    const { from, to } = monthRange(m.year, m.month)
    const s = summarize(m.year, m.month, txns.filter((t) => t.date >= from && t.date <= to))
    return { year: m.year, month: m.month, totalIncome: s.totalIncome, totalExpense: s.totalExpense, balance: s.balance }
  })
}
