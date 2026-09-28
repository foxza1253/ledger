import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'income' | 'expense' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand'

const tones: Record<BadgeTone, string> = {
  income:  'bg-income-soft text-income ring-income/20',
  expense: 'bg-expense-soft text-expense ring-expense/20',
  success: 'bg-income-soft text-income ring-income/20',
  warning: 'bg-warning-soft text-warning ring-warning/25',
  danger:  'bg-danger-soft text-danger ring-danger/20',
  info:    'bg-info-soft text-info ring-info/20',
  neutral: 'bg-bg text-muted ring-border-strong',
  brand:   'bg-primary-soft text-primary-strong ring-primary-muted',
}

/** Status pill — always icon + text so meaning never depends on color alone. */
export default function StatusBadge({
  tone, icon: Icon, children, className,
}: { tone: BadgeTone; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon size={12} strokeWidth={2.6} aria-hidden />}
      {children}
    </span>
  )
}
