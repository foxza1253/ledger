'use client'

import { useCallback } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import { useQuery } from '@/common/hooks/use-query'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import StatusBadge from '@/components/ui/StatusBadge'
import IncomeExpenseBars, { ChartLegend } from '@/components/charts/IncomeExpenseBars'
import CategoryBreakdown from '@/components/charts/CategoryBreakdown'
import { fetchMonthlySummary, fetchTrend } from '@/modules/monthly/monthly.service'
import { formatCurrency } from '@/common/utils/currency'
import { formatMonthShort, formatMonthYear, getMonthKey } from '@/lib/date'
import { cn } from '@/lib/cn'

const TREND_MONTHS = 6

function ChangeBadge({ current, previous, invert }: { current: number; previous: number; invert?: boolean }) {
  if (previous === 0) return <StatusBadge tone="neutral">ไม่มีข้อมูลเดือนก่อน</StatusBadge>
  const pct = ((current - previous) / previous) * 100
  if (Math.abs(pct) < 0.5) return <StatusBadge tone="neutral" icon={Minus}>เท่าเดิม</StatusBadge>
  const up = pct > 0
  // For expenses, going up is bad; for income, going up is good.
  const good = invert ? !up : up
  return (
    <StatusBadge tone={good ? 'success' : 'danger'} icon={up ? ArrowUpRight : ArrowDownRight}>
      {up ? '+' : '−'}{Math.abs(pct).toFixed(0)}% จากเดือนก่อน
    </StatusBadge>
  )
}

export default function ReportContainer() {
  const { year, month, symbol, findCategory, setYearMonth } = useLedger()

  const fetcher = useCallback(
    (signal: AbortSignal) => Promise.all([fetchMonthlySummary(year, month, signal), fetchTrend(year, month, TREND_MONTHS, signal)]),
    [year, month],
  )
  const { data, loading, error, reload } = useQuery(`report:${year}-${month}`, fetcher)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) {
    return <div className="space-y-5" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="card h-48" />)}</div>
  }

  const [summary, trend] = data
  const prev = trend.at(-2)
  const hasData = summary.transactionCount > 0
  const expenseRows = summary.byCategory.filter((c) => c.type === 'expense')
  const savingsRate = summary.totalIncome > 0 ? (summary.balance / summary.totalIncome) * 100 : null
  const avgExpense = trend.reduce((s, t) => s + t.totalExpense, 0) / trend.length

  return (
    <div className={cn('space-y-5 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
      <section className="card p-5" aria-labelledby="trend-title">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 id="trend-title" className="text-base font-semibold text-text">แนวโน้ม {TREND_MONTHS} เดือน</h2>
          <ChartLegend />
        </div>
        <p className="mb-4 text-sm text-muted">
          รายจ่ายเฉลี่ย <span className="font-semibold text-text tabular-nums">{formatCurrency(avgExpense, symbol, 'th-TH', 0)}</span> / เดือน · แตะที่แท่งเพื่อเปลี่ยนเดือน
        </p>
        <IncomeExpenseBars
          caption={`รายรับ-รายจ่าย ${TREND_MONTHS} เดือนล่าสุด`}
          symbol={symbol}
          height={200}
          minColumnWidth={48}
          dimUnhighlighted
          groups={trend.map((t) => ({
            key: getMonthKey(t.year, t.month),
            label: formatMonthShort(t.year, t.month),
            title: formatMonthYear(t.year, t.month),
            income: t.totalIncome,
            expense: t.totalExpense,
            highlighted: t.year === year && t.month === month,
            onSelect: () => setYearMonth(t.year, t.month),
          }))}
        />
      </section>

      {!hasData ? (
        <div className="card">
          <EmptyState icon={TrendingUp} title={`ยังไม่มีข้อมูลใน${formatMonthYear(year, month)}`} />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          <section className="card p-5 lg:col-span-2" aria-labelledby="month-sum-title">
            <h2 id="month-sum-title" className="mb-4 text-base font-semibold text-text">สรุป{formatMonthYear(year, month)}</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-muted">รายรับรวม</dt>
                <dd className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xl font-bold text-income tabular-nums">{formatCurrency(summary.totalIncome, symbol)}</span>
                  {prev && <ChangeBadge current={summary.totalIncome} previous={prev.totalIncome} />}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">รายจ่ายรวม</dt>
                <dd className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xl font-bold text-expense tabular-nums">{formatCurrency(summary.totalExpense, symbol)}</span>
                  {prev && <ChangeBadge current={summary.totalExpense} previous={prev.totalExpense} invert />}
                </dd>
              </div>
              <div className="border-t border-border pt-4">
                <dt className="text-sm text-muted">คงเหลือสุทธิ</dt>
                <dd className="flex flex-wrap items-center justify-between gap-2">
                  <span className={cn('text-2xl font-bold tabular-nums', summary.balance < 0 ? 'text-danger' : 'text-text')}>
                    {summary.balance < 0 ? '−' : ''}{formatCurrency(Math.abs(summary.balance), symbol)}
                  </span>
                  {savingsRate !== null && (
                    <StatusBadge tone={savingsRate >= 20 ? 'success' : savingsRate >= 0 ? 'warning' : 'danger'}>
                      อัตราออม {savingsRate.toFixed(0)}%
                    </StatusBadge>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-5 lg:col-span-3" aria-labelledby="share-title">
            <h2 id="share-title" className="mb-4 text-base font-semibold text-text">สัดส่วนรายจ่าย</h2>
            {expenseRows.length === 0 ? (
              <p className="text-sm text-muted">ไม่มีรายจ่ายในเดือนนี้</p>
            ) : (
              <CategoryBreakdown rows={expenseRows} total={summary.totalExpense} type="expense" symbol={symbol}
                findCategory={findCategory} limit={7} />
            )}
          </section>
        </div>
      )}
    </div>
  )
}
