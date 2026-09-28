'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/common/utils/currency'
import { cn } from '@/lib/cn'
import CategoryIcon from './CategoryIcon'
import type { Transaction, Category } from '@/common/type/interface'

interface TransactionCardProps {
  transaction: Transaction
  category?: Category
  symbol?: string
  index?: number
  showDate?: boolean
}

export default function TransactionCard({ transaction, category, symbol = '฿', index = 0, showDate }: TransactionCardProps) {
  const isIncome = transaction.type === 'income'

  return (
    <li
      className="list-none animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards duration-200"
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
    >
      <Link
        href={`/transactions/${encodeURIComponent(transaction.id)}?date=${transaction.date}`}
        className="group flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-primary-soft/50 focus-visible:bg-primary-soft/50 sm:px-5"
      >
        <CategoryIcon category={category} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-text">{transaction.description}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">
            <span className="truncate">{category?.name ?? 'ไม่มีหมวดหมู่'}</span>
            {showDate && <><span aria-hidden>·</span><span>{transaction.date.split('-').reverse().slice(0, 2).join('/')}</span></>}
            {transaction.note && <><span aria-hidden>·</span><span className="truncate text-subtle">{transaction.note}</span></>}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className={cn('text-[15px] font-bold tabular-nums', isIncome ? 'text-income' : 'text-expense')}>
            <span className="sr-only">{isIncome ? 'รายรับ' : 'รายจ่าย'} </span>
            {isIncome ? '+' : '−'}{formatCurrency(transaction.amount, symbol)}
          </span>
          <ChevronRight size={16} className="text-subtle opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
        </div>
      </Link>
    </li>
  )
}
