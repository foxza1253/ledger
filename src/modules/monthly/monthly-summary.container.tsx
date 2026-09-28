'use client'

import { useCallback } from 'react'
import { CalendarDays } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import { useQuery } from '@/common/hooks/use-query'
import SummaryCard from '@/components/ui/SummaryCard'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import IncomeExpenseBars, { ChartLegend, type BarGroup } from '@/components/charts/IncomeExpenseBars'
import CategoryBreakdown from '@/components/charts/CategoryBreakdown'
import { fetchMonthlySummary } from './monthly.service'
import { formatCurrency } from '@/common/utils/currency'
import { daysInMonth, formatMonthYear, getMonthKey, parseDateOnly, todayString } from '@/lib/date'
import { cn } from '@/lib/cn'

export default function MonthlySummaryContainer() {
  const { year, month, symbol, findCategory } = useLedger()
  const fetcher = useCallback((signal: AbortSignal) => fetchMonthlySummary(year, month, signal), [year, month])
  const { data: summary, loading, error, reload } = useQuery(`monthly:${year}-${month}`, fetcher)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!summary) {
    return (
      <div className="space-y-5" aria-busy="true">
        <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="card h-28" />)}</div>
        <div className="card h-64" />
      </div>
    )
  }

  const hasData = summary.transactionCount > 0
  const today = todayString()
  const byDate = new Map(summary.dailyBreakdown.map((d) => [d.date, d]))
  const days: BarGroup[] = Array.from({ length: daysInMonth(summary.year, summary.month) }, (_, i) => {
    const date = `${getMonthKey(summary.year, summary.month)}-${String(i + 1).padStart(2, '0')}`
    const d = byDate.get(date)
    return {
      key: date,
      label: (i + 1) % 5 === 0 || i === 0 ? String(i + 1) : '',
      title: parseDateOnly(date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }),
      income: d?.income ?? 0,
      expense: d?.expense ?? 0,
      highlighted: date === today,
    }
  })
  const activeDays = summary.dailyBreakdown.filter((d) => d.expense > 0).length
  const avgDaily = activeDays ? summary.totalExpense / activeDays : 0
  const expenseRows = summary.byCategory.filter((c) => c.type === 'expense')
  const incomeRows = summary.byCategory.filter((c) => c.type === 'income')

  return (
    <div className={cn('space-y-5 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="รายรับ" amount={summary.totalIncome} type="income" symbol={symbol} index={0} />
        <SummaryCard label="รายจ่าย" amount={summary.totalExpense} type="expense" symbol={symbol} index={1}
          hint={activeDays ? `เฉลี่ย ${formatCurrency(avgDaily, symbol, 'th-TH', 0)} / วันที่มีรายจ่าย` : undefined} />
        <SummaryCard label="คงเหลือ" amount={summary.balance} type="balance" symbol={symbol} index={2} />
      </div>

      {!hasData ? (
        <div className="card">
          <EmptyState icon={CalendarDays} title={`ยังไม่มีข้อมูลใน${formatMonthYear(year, month)}`}
            action={{ href: '/transactions/new', label: 'บันทึกรายการ' }} />
        </div>
      ) : (
        <>
          <section className="card p-5" aria-labelledby="daily-title">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="daily-title" className="text-base font-semibold text-text">รายรับ-รายจ่ายรายวัน</h2>
              <ChartLegend />
            </div>
            <IncomeExpenseBars groups={days} symbol={symbol} caption={`รายรับ-รายจ่ายรายวัน ${formatMonthYear(year, month)}`} minColumnWidth={16} />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            {expenseRows.length > 0 && (
              <section className="card p-5" aria-labelledby="exp-cat-title">
                <div className="mb-4 flex items-center justify-between">
                  <h2 id="exp-cat-title" className="text-base font-semibold text-text">รายจ่ายตามหมวดหมู่</h2>
                  <span className="text-sm font-bold text-expense tabular-nums">{formatCurrency(summary.totalExpense, symbol)}</span>
                </div>
                <CategoryBreakdown rows={expenseRows} total={summary.totalExpense} type="expense" symbol={symbol} findCategory={findCategory} />
              </section>
            )}
            {incomeRows.length > 0 && (
              <section className="card p-5" aria-labelledby="inc-cat-title">
                <div className="mb-4 flex items-center justify-between">
                  <h2 id="inc-cat-title" className="text-base font-semibold text-text">รายรับตามหมวดหมู่</h2>
                  <span className="text-sm font-bold text-income tabular-nums">{formatCurrency(summary.totalIncome, symbol)}</span>
                </div>
                <CategoryBreakdown rows={incomeRows} total={summary.totalIncome} type="income" symbol={symbol} findCategory={findCategory} />
              </section>
            )}
          </div>
        </>
      )}
    </div>
  )
}
