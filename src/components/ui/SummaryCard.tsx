'use client'

import { useEffect, useRef } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SummaryCardProps {
  label: string
  amount: number
  type: 'income' | 'expense' | 'balance'
  symbol?: string
}

const config = {
  income:  { Icon: TrendingUp,   iconClass: 'text-emerald-500', iconBg: 'bg-emerald-50', valueClass: 'text-emerald-600' },
  expense: { Icon: TrendingDown, iconClass: 'text-rose-500',    iconBg: 'bg-rose-50',    valueClass: 'text-rose-500'    },
  balance: { Icon: Wallet,       iconClass: 'text-primary',     iconBg: 'bg-indigo-50',  valueClass: 'text-primary'     },
}

function AnimatedNumber({ value, symbol }: { value: number; symbol: string }) {
  const spring = useSpring(value, { stiffness: 120, damping: 22 })
  const display = useTransform(spring, (v) =>
    `${symbol}${Math.round(v).toLocaleString('th-TH')}`
  )

  useEffect(() => { spring.set(value) }, [spring, value])

  return <motion.span>{display}</motion.span>
}

export default function SummaryCard({ label, amount, type, symbol = '฿' }: SummaryCardProps) {
  const { Icon, iconClass, iconBg, valueClass } = config[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-2xl bg-surface border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">{label}</span>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>
          <Icon size={16} className={iconClass} strokeWidth={2} />
        </span>
      </div>
      <p className={cn('text-2xl font-bold tracking-tight tabular-nums', valueClass)}>
        <AnimatedNumber value={amount} symbol={symbol} />
      </p>
    </motion.div>
  )
}
