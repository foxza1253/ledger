import { AlertOctagon, AlertTriangle, CheckCircle2, PiggyBank } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/common/utils/currency'
import { cn } from '@/lib/cn'

export function budgetStatus(spent: number, budget: number) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0
  if (pct > 100) return { tone: 'danger' as const, label: 'เกินงบ', Icon: AlertOctagon, bar: 'bg-danger', pct }
  if (pct >= 80) return { tone: 'warning' as const, label: 'ใกล้เต็มงบ', Icon: AlertTriangle, bar: 'bg-amber-500', pct }
  return { tone: 'success' as const, label: 'อยู่ในงบ', Icon: CheckCircle2, bar: 'bg-income-mark', pct }
}

export default function BudgetCard({ spent, budget, symbol }: { spent: number; budget: number; symbol: string }) {
  const s = budgetStatus(spent, budget)
  const remaining = budget - spent

  return (
    <section className="card p-5" aria-labelledby="budget-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
            <PiggyBank size={18} />
          </span>
          <h2 id="budget-title" className="text-base font-semibold text-text">งบประมาณเดือนนี้</h2>
        </div>
        <StatusBadge tone={s.tone} icon={s.Icon}>{s.label} · {s.pct.toFixed(0)}%</StatusBadge>
      </div>

      <div
        className="h-3 w-full overflow-hidden rounded-full bg-bg ring-1 ring-inset ring-border"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(100, s.pct))}
        aria-label="สัดส่วนการใช้งบประมาณ"
      >
        <div className={cn('h-full rounded-full transition-[width] duration-700', s.bar)} style={{ width: `${Math.min(100, s.pct)}%` }} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">
          ใช้ไป <span className="font-semibold text-text tabular-nums">{formatCurrency(spent, symbol)}</span>
          {' '}จาก <span className="tabular-nums">{formatCurrency(budget, symbol)}</span>
        </span>
        <span className={cn('font-semibold tabular-nums', remaining < 0 ? 'text-danger' : 'text-income')}>
          {remaining < 0 ? `เกิน ${formatCurrency(-remaining, symbol)}` : `เหลือ ${formatCurrency(remaining, symbol)}`}
        </span>
      </div>
    </section>
  )
}
