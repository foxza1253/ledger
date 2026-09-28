'use client'

import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/common/utils/currency'

interface SummaryCardProps {
  label: string
  amount: number
  type: 'income' | 'expense' | 'balance'
  symbol?: string
  hint?: React.ReactNode
  index?: number
}

const config = {
  income:  { Icon: TrendingUp,   chip: 'bg-income-soft text-income',   value: 'text-income',  bar: 'bg-income-mark' },
  expense: { Icon: TrendingDown, chip: 'bg-expense-soft text-expense', value: 'text-expense', bar: 'bg-expense-mark' },
  balance: { Icon: Wallet,       chip: 'bg-primary-soft text-primary-strong', value: 'text-text', bar: 'bg-primary' },
}

function AnimatedNumber({ value, symbol }: { value: number; symbol: string }) {
  const spring = useSpring(value, { stiffness: 140, damping: 24 })
  const display = useTransform(spring, (v) => {
    const s = formatCurrency(Math.abs(v), symbol, 'th-TH', 0)
    return v < -0.5 ? `−${s}` : s
  })
  useEffect(() => { spring.set(value) }, [spring, value])
  return <motion.span>{display}</motion.span>
}

export default function SummaryCard({ label, amount, type, symbol = '฿', hint, index = 0 }: SummaryCardProps) {
  const { Icon, chip, value, bar } = config[type]
  const negativeBalance = type === 'balance' && amount < 0

  return (
    // CSS entrance (not framer initial opacity:0) so prerendered HTML is visible before hydration
    <div
      className="card relative overflow-hidden p-5 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-300"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', negativeBalance ? 'bg-danger' : bar)} aria-hidden />
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', chip)}>
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
      <p className={cn('text-2xl font-bold tracking-tight tabular-nums sm:text-[1.7rem]', negativeBalance ? 'text-danger' : value)}>
        <AnimatedNumber value={amount} symbol={symbol} />
      </p>
      {hint && <div className="mt-2 text-sm text-muted">{hint}</div>}
    </div>
  )
}
