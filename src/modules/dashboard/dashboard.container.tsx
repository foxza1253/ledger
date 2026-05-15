'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Plus, ReceiptText } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import SummaryCard from '@/components/ui/SummaryCard'
import TransactionCard from '@/components/ui/TransactionCard'
import { formatMonthYear } from '@/lib/date'
import type { DashboardData } from './dashboard.type'
import type { Category } from '@/common/type/interface'

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-surface border border-border p-5 shadow-sm animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-3 w-16 rounded bg-gray-100" />
        <div className="h-8 w-8 rounded-lg bg-gray-100" />
      </div>
      <div className="h-7 w-28 rounded bg-gray-100" />
    </div>
  )
}

export default function DashboardContainer() {
  const { year, month, settings, categories } = useLedger()
  const [data, setData] = useState<DashboardData>({ summary: null, recentTransactions: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/ledger/monthly?year=${year}&month=${month}`).then((r) => r.json()),
      fetch(`/api/ledger/transactions?year=${year}&month=${month}`).then((r) => r.json()),
    ])
      .then(([monthlyData, txData]) => {
        setData({
          summary: monthlyData.summary ?? null,
          recentTransactions: (txData.transactions ?? []).slice(0, 5),
        })
      })
      .finally(() => setLoading(false))
  }, [year, month])

  function findCategory(categoryId: string): Category | undefined {
    if (!categories) return undefined
    return [...categories.income, ...categories.expense].find((c) => c.id === categoryId)
  }

  const symbol = settings?.currencySymbol ?? '฿'
  const summary = data.summary
  const budget = settings?.monthlyBudget
  const budgetPct = budget?.enabled
    ? Math.min(100, ((summary?.totalExpense ?? 0) / budget.amount) * 100)
    : 0
  const overBudget = budget?.enabled && (summary?.totalExpense ?? 0) > budget.amount

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {loading
          ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
          : <>
              <SummaryCard label="รายรับ"  amount={summary?.totalIncome  ?? 0} type="income"  symbol={symbol} />
              <SummaryCard label="รายจ่าย" amount={summary?.totalExpense ?? 0} type="expense" symbol={symbol} />
              <SummaryCard label="คงเหลือ" amount={summary?.balance      ?? 0} type="balance" symbol={symbol} />
            </>
        }
      </div>

      {/* Budget */}
      {!loading && budget?.enabled && (
        <div className="rounded-2xl bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text">งบประมาณเดือนนี้</span>
              {overBudget && (
                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-500">
                  เกินงบ
                </span>
              )}
            </div>
            <span className="text-sm text-muted tabular-nums">
              {symbol}{(summary?.totalExpense ?? 0).toLocaleString('th-TH')}
              <span className="text-border mx-1">/</span>
              {symbol}{budget.amount.toLocaleString('th-TH')}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-bg">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${overBudget ? 'bg-expense' : 'bg-primary'}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {overBudget
              ? `เกินงบ ${symbol}${((summary?.totalExpense ?? 0) - budget.amount).toLocaleString('th-TH')}`
              : `เหลือ ${symbol}${(budget.amount - (summary?.totalExpense ?? 0)).toLocaleString('th-TH')}`
            }
          </p>
        </div>
      )}

      {/* Recent transactions */}
      <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">รายการล่าสุด</h2>
          <Link href="/transactions" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-indigo-700">
            ดูทั้งหมด <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-gray-100" />
                  <div className="h-2.5 w-20 rounded bg-gray-100" />
                </div>
                <div className="h-3 w-16 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : data.recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted">
            <ReceiptText size={36} strokeWidth={1.5} className="mb-3 text-border" />
            <p className="text-sm">ยังไม่มีรายการในเดือนนี้</p>
            <Link href="/transactions/new" className="mt-3 text-xs font-medium text-primary hover:underline">
              บันทึกรายการแรก
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.recentTransactions.map((txn, i) => (
              <TransactionCard key={txn.id} transaction={txn} category={findCategory(txn.categoryId)} symbol={symbol} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.div
        className="fixed bottom-8 right-8"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.2 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
      >
        <Link
          href="/transactions/new"
          className="flex h-13 w-13 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
          aria-label="บันทึกรายการใหม่"
        >
          <Plus size={22} strokeWidth={2.5} />
        </Link>
      </motion.div>
    </div>
  )
}
