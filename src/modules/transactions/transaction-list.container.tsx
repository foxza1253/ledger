'use client'

import { useCallback, useDeferredValue, useState } from 'react'
import Link from 'next/link'
import { Plus, ReceiptText, Search, SearchX, TrendingDown, TrendingUp, X } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import { useQuery } from '@/common/hooks/use-query'
import TransactionCard from '@/components/ui/TransactionCard'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import StatusBadge from '@/components/ui/StatusBadge'
import Fab from '@/components/layout/fab'
import { fetchTransactions } from './transaction.service'
import { formatCurrency } from '@/common/utils/currency'
import { parseDateOnly, todayString, toDateString } from '@/lib/date'
import { cn } from '@/lib/cn'
import type { Transaction } from '@/common/type/interface'

function groupByDate(txns: Transaction[]) {
  const map = new Map<string, Transaction[]>()
  for (const t of txns) map.set(t.date, [...(map.get(t.date) ?? []), t])
  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => ({ date, items }))
}

function formatGroupDate(dateStr: string): string {
  const today = todayString()
  const y = new Date()
  y.setDate(y.getDate() - 1)
  if (dateStr === today) return 'วันนี้'
  if (dateStr === toDateString(y)) return 'เมื่อวาน'
  return parseDateOnly(dateStr).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })
}

type Filter = 'all' | 'income' | 'expense'

const filterOptions: { val: Filter; label: string }[] = [
  { val: 'all', label: 'ทั้งหมด' },
  { val: 'income', label: 'รายรับ' },
  { val: 'expense', label: 'รายจ่าย' },
]

export default function TransactionListContainer() {
  const { year, month, symbol, findCategory } = useLedger()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const q = useDeferredValue(search.trim().toLowerCase())

  const fetcher = useCallback((signal: AbortSignal) => fetchTransactions(year, month, undefined, signal), [year, month])
  const { data, loading, error, reload } = useQuery(`txns:${year}-${month}`, fetcher)
  const transactions = loading ? [] : data ?? []

  const filtered = transactions.filter((t) => {
    if (filter !== 'all' && t.type !== filter) return false
    if (!q) return true
    const cat = findCategory(t.categoryId)
    return [t.description, t.note, cat?.name, String(t.amount)].some((s) => s?.toLowerCase().includes(q))
  })
  const grouped = groupByDate(filtered)
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-bg p-1 ring-1 ring-inset ring-border" role="tablist" aria-label="กรองประเภท">
          {filterOptions.map(({ val, label }) => (
            <button
              key={val}
              role="tab"
              aria-selected={filter === val}
              onClick={() => setFilter(val)}
              className={cn(
                'flex-1 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all sm:flex-none',
                filter === val
                  ? cn('bg-surface shadow-sm ring-1 ring-border', val === 'income' ? 'text-income' : val === 'expense' ? 'text-expense' : 'text-primary-strong')
                  : 'text-muted hover:text-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" />
          <label htmlFor="txn-search" className="sr-only">ค้นหารายการ</label>
          <input
            id="txn-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา คำอธิบาย หมวดหมู่ ยอดเงิน"
            className="field-input py-2 pl-9"
          />
        </div>

        <Link href="/transactions/new" className="btn-primary hidden py-2 sm:inline-flex">
          <Plus size={15} strokeWidth={2.5} /> บันทึก
        </Link>
      </div>

      {!loading && !error && (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="income" icon={TrendingUp}>รับ {formatCurrency(totalIncome, symbol)}</StatusBadge>
          <StatusBadge tone="expense" icon={TrendingDown}>จ่าย {formatCurrency(totalExpense, symbol)}</StatusBadge>
          <StatusBadge tone="neutral">{transactions.length} รายการ</StatusBadge>
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <div className="card divide-y divide-border overflow-hidden" aria-busy="true">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="skeleton h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-40" />
                <div className="skeleton h-3 w-24" />
              </div>
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="card">
          {transactions.length === 0 ? (
            <EmptyState icon={ReceiptText} title="ยังไม่มีรายการในเดือนนี้" description="กดปุ่มด้านล่างเพื่อบันทึกรายการแรก"
              action={{ href: '/transactions/new', label: 'บันทึกรายการ' }} />
          ) : (
            <EmptyState icon={SearchX} title="ไม่พบรายการที่ตรงกัน" description="ลองเปลี่ยนคำค้นหาหรือตัวกรอง" />
          )}
          {transactions.length > 0 && (
            <div className="-mt-8 flex justify-center pb-8">
              <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setFilter('all') }}>
                <X size={14} /> ล้างตัวกรอง
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ date, items }) => {
            const bal = items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
            return (
              <section key={date} className="card overflow-hidden" aria-label={formatGroupDate(date)}>
                <div className="flex items-center justify-between border-b border-border bg-bg/70 px-5 py-2.5">
                  <h2 className="text-sm font-semibold text-text">{formatGroupDate(date)}</h2>
                  <span className={cn('text-sm font-semibold tabular-nums', bal >= 0 ? 'text-income' : 'text-expense')}>
                    {bal >= 0 ? '+' : '−'}{formatCurrency(Math.abs(bal), symbol)}
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {items.map((txn, i) => (
                    <TransactionCard key={txn.id} transaction={txn} category={findCategory(txn.categoryId)} symbol={symbol} index={i} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <Fab />
    </div>
  )
}
