'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/common/utils/currency'
import { cn } from '@/lib/cn'
import type { Transaction, Category } from '@/common/type/interface'

interface TransactionCardProps {
  transaction: Transaction
  category?: Category
  symbol?: string
  index?: number
}

export default function TransactionCard({ transaction, category, symbol = '฿', index = 0 }: TransactionCardProps) {
  const isIncome = transaction.type === 'income'

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
    >
      <Link
        href={`/transactions/${transaction.id}?date=${transaction.date}`}
        className="flex items-center gap-4 px-4 py-3 hover:bg-bg active:scale-[0.99] transition-all rounded-xl"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: category ? `${category.color}15` : '#f1f5f9' }}
        >
          {category?.icon ?? '💰'}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text truncate">{transaction.description}</p>
          {category && (
            <p className="text-xs text-muted mt-0.5 truncate">{category.name}</p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className={cn('text-sm font-semibold tabular-nums', isIncome ? 'text-income' : 'text-expense')}>
            {isIncome ? '+' : '−'}{formatCurrency(transaction.amount, symbol)}
          </p>
          {transaction.note && (
            <p className="text-xs text-muted mt-0.5 max-w-32 truncate">{transaction.note}</p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
