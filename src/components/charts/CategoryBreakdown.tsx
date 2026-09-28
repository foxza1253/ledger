import { cn } from '@/lib/cn'
import { formatCurrency } from '@/common/utils/currency'
import type { Category } from '@/common/type/interface'

export interface BreakdownRow {
  categoryId: string
  total: number
  count: number
}

/**
 * Ranked horizontal bars (replaces the donut: easier to compare close values,
 * and a single hue per type means user-picked category colors can't collide).
 */
export default function CategoryBreakdown({
  rows, total, type, symbol, findCategory, limit,
}: {
  rows: BreakdownRow[]
  total: number
  type: 'income' | 'expense'
  symbol: string
  findCategory: (id: string) => Category | undefined
  limit?: number
}) {
  const sorted = [...rows].sort((a, b) => b.total - a.total)
  const shown = limit && sorted.length > limit ? sorted.slice(0, limit - 1) : sorted
  const rest = limit && sorted.length > limit ? sorted.slice(limit - 1) : []
  const items = rest.length
    ? [...shown, { categoryId: '__other', total: rest.reduce((s, r) => s + r.total, 0), count: rest.reduce((s, r) => s + r.count, 0) }]
    : shown
  const max = Math.max(1, ...items.map((r) => r.total))

  return (
    <ul className="space-y-3.5">
      {items.map((r) => {
        const cat = r.categoryId === '__other' ? undefined : findCategory(r.categoryId)
        const name = r.categoryId === '__other' ? `อื่น ๆ (${rest.length} หมวด)` : cat?.name ?? 'ไม่มีหมวดหมู่'
        const pct = total > 0 ? (r.total / total) * 100 : 0
        return (
          <li key={r.categoryId}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-[15px] font-medium text-text">
                <span aria-hidden className="text-base">{r.categoryId === '__other' ? '📦' : cat?.icon ?? '💰'}</span>
                <span className="truncate">{name}</span>
                <span className="shrink-0 text-xs text-subtle">{r.count} รายการ</span>
              </span>
              <span className="shrink-0 text-sm tabular-nums">
                <span className="font-semibold text-text">{formatCurrency(r.total, symbol)}</span>
                <span className="ml-2 inline-block w-12 text-right text-muted">{pct.toFixed(pct < 10 ? 1 : 0)}%</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg" role="presentation">
              <div
                className={cn('h-full rounded-full transition-[width] duration-700', type === 'income' ? 'bg-income-mark' : 'bg-expense-mark')}
                style={{ width: `${(r.total / max) * 100}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
