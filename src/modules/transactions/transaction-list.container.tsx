'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, ReceiptText } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import TransactionCard from '@/components/ui/TransactionCard'
import { fetchTransactions } from './transaction.service'
import { formatCurrency } from '@/common/utils/currency'
import type { Transaction, Category } from '@/common/type/interface'

function groupByDate(txns: Transaction[]) {
  const map = new Map<string, Transaction[]>()
  for (const t of txns) {
    const g = map.get(t.date) ?? []
    g.push(t)
    map.set(t.date, g)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
}

function formatGroupDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'วันนี้'
  if (d.toDateString() === yesterday.toDateString()) return 'เมื่อวาน'
  return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
}

function getDayBalance(items: Transaction[]) {
  return items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
}

type Filter = 'all' | 'income' | 'expense'

export default function TransactionListContainer() {
  const { year, month, settings, categories } = useLedger()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    setLoading(true)
    fetchTransactions(year, month).then(setTransactions).finally(() => setLoading(false))
  }, [year, month])

  function findCategory(id: string): Category | undefined {
    if (!categories) return undefined
    return [...categories.income, ...categories.expense].find((c) => c.id === id)
  }

  const symbol = settings?.currencySymbol ?? '฿'
  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)
  const grouped = groupByDate(filtered)
  const totalIncome  = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const filterOptions: { val: Filter; label: string }[] = [
    { val: 'all',     label: 'ทั้งหมด' },
    { val: 'income',  label: 'รายรับ' },
    { val: 'expense', label: 'รายจ่าย' },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-xl bg-bg border border-border p-0.5 gap-0.5">
          {filterOptions.map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === val
                  ? val === 'income'
                    ? 'bg-surface text-income shadow-sm'
                    : val === 'expense'
                    ? 'bg-surface text-expense shadow-sm'
                    : 'bg-surface text-text shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-income tabular-nums">+{formatCurrency(totalIncome, symbol)}</span>
          <span className="text-xs font-semibold text-expense tabular-nums">−{formatCurrency(totalExpense, symbol)}</span>
          <Link
            href="/transactions/new"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm shadow-primary/10"
          >
            <Plus size={13} strokeWidth={2.5} /> บันทึก
          </Link>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-36 rounded bg-gray-100" />
                <div className="h-2.5 w-24 rounded bg-gray-100" />
              </div>
              <div className="h-3 w-16 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl bg-surface border border-border shadow-sm flex flex-col items-center justify-center py-16 text-muted">
          <ReceiptText size={40} strokeWidth={1.5} className="mb-3 text-border" />
          <p className="text-sm font-medium">ยังไม่มีรายการ</p>
          <Link href="/transactions/new" className="mt-3 text-xs font-medium text-primary hover:underline">
            บันทึกรายการแรก
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ date, items }) => {
            const bal = getDayBalance(items)
            return (
              <div key={date} className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-bg border-b border-border">
                  <span className="text-xs font-semibold text-muted">{formatGroupDate(date)}</span>
                  <span className={`text-xs font-semibold tabular-nums ${bal >= 0 ? 'text-income' : 'text-expense'}`}>
                    {bal >= 0 ? '+' : '−'}{formatCurrency(Math.abs(bal), symbol)}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {items.map((txn, i) => (
                    <TransactionCard key={txn.id} transaction={txn} category={findCategory(txn.categoryId)} symbol={symbol} index={i} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <motion.div
        className="fixed bottom-8 right-8"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.15 }}
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
