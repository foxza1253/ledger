'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, PieChart, ReceiptText } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import { useQuery } from '@/common/hooks/use-query'
import SummaryCard from '@/components/ui/SummaryCard'
import TransactionCard from '@/components/ui/TransactionCard'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Fab from '@/components/layout/fab'
import CategoryBreakdown from '@/components/charts/CategoryBreakdown'
import { fetchMonthlySummary } from '@/modules/monthly/monthly.service'
import { fetchTransactions } from '@/modules/transactions/transaction.service'
import { cn } from '@/lib/cn'
import BudgetCard from './budget-card'
import type { DashboardData } from './dashboard.type'

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="กำลังโหลด">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card space-y-3 p-5">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-8 w-32" />
          </div>
        ))}
      </div>
      <div className="card h-28" />
      <div className="card h-64" />
    </div>
  )
}

export default function DashboardContainer() {
  const { year, month, settings, symbol, findCategory } = useLedger()

  const fetcher = useCallback(
    async (signal: AbortSignal): Promise<DashboardData> => {
      const [summary, txns] = await Promise.all([
        fetchMonthlySummary(year, month, signal),
        fetchTransactions(year, month, undefined, signal),
      ])
      return { summary, recentTransactions: txns.slice(0, 6) }
    },
    [year, month],
  )
  const { data, loading, error, reload } = useQuery(`dashboard:${year}-${month}`, fetcher)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return <DashboardSkeleton />

  const { summary, recentTransactions } = data
  const budget = settings?.monthlyBudget
  const expenseRows = summary.byCategory.filter((c) => c.type === 'expense')
  const incomeCount = summary.byCategory.filter((c) => c.type === 'income').reduce((s, c) => s + c.count, 0)
  const expenseCount = summary.transactionCount - incomeCount

  return (
    <div className={cn('space-y-5 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="รายรับ" amount={summary.totalIncome} type="income" symbol={symbol} index={0}
          hint={`${incomeCount} รายการ`} />
        <SummaryCard label="รายจ่าย" amount={summary.totalExpense} type="expense" symbol={symbol} index={1}
          hint={`${expenseCount} รายการ`} />
        <SummaryCard label="คงเหลือ" amount={summary.balance} type="balance" symbol={symbol} index={2}
          hint={summary.totalIncome > 0
            ? `ออมได้ ${Math.max(0, (summary.balance / summary.totalIncome) * 100).toFixed(0)}% ของรายรับ`
            : 'ยังไม่มีรายรับ'} />
      </div>

      {budget?.enabled && budget.amount > 0 && (
        <BudgetCard spent={summary.totalExpense} budget={budget.amount} symbol={symbol} />
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="card overflow-hidden lg:col-span-3" aria-labelledby="recent-title">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 id="recent-title" className="text-base font-semibold text-text">รายการล่าสุด</h2>
            <Link href="/transactions" className="flex items-center gap-1 text-sm font-semibold text-primary-strong hover:underline">
              ดูทั้งหมด <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <EmptyState icon={ReceiptText} title="ยังไม่มีรายการในเดือนนี้" description="เริ่มบันทึกรายรับ-รายจ่ายรายการแรกของคุณ"
              action={{ href: '/transactions/new', label: 'บันทึกรายการแรก' }} />
          ) : (
            <ul className="divide-y divide-border">
              {recentTransactions.map((txn, i) => (
                <TransactionCard key={txn.id} transaction={txn} category={findCategory(txn.categoryId)} symbol={symbol} index={i} showDate />
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5 lg:col-span-2" aria-labelledby="top-expense-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="top-expense-title" className="text-base font-semibold text-text">รายจ่ายสูงสุด</h2>
            <Link href="/reports" className="text-sm font-semibold text-primary-strong hover:underline">รายงาน</Link>
          </div>
          {expenseRows.length === 0 ? (
            <EmptyState icon={PieChart} title="ยังไม่มีรายจ่าย" />
          ) : (
            <CategoryBreakdown rows={expenseRows} total={summary.totalExpense} type="expense" symbol={symbol}
              findCategory={findCategory} limit={5} />
          )}
        </section>
      </div>

      <Fab />
    </div>
  )
}
