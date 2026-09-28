'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { formatCompact, formatCurrency } from '@/common/utils/currency'

export interface BarGroup {
  key: string
  /** Axis label under the group */
  label: string
  /** Full label for tooltip / table */
  title: string
  income: number
  expense: number
  highlighted?: boolean
  onSelect?: () => void
}

function niceMax(v: number): number {
  if (v <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(v))
  const n = v / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return step * pow
}

export function ChartLegend() {
  return (
    <div className="flex items-center gap-4 text-sm text-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-income-mark" aria-hidden /> รายรับ
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-expense-mark" aria-hidden /> รายจ่าย
      </span>
    </div>
  )
}

/**
 * Grouped income/expense columns on one y-axis, with recessive gridlines,
 * hover/focus tooltip, and a visually-hidden data table for screen readers.
 */
export default function IncomeExpenseBars({
  groups, symbol, height = 180, minColumnWidth = 14, caption, dimUnhighlighted = false,
}: {
  groups: BarGroup[]
  symbol: string
  height?: number
  minColumnWidth?: number
  caption: string
  dimUnhighlighted?: boolean
}) {
  const [active, setActive] = useState<number | null>(null)
  const max = niceMax(Math.max(0, ...groups.flatMap((g) => [g.income, g.expense])))
  const ticks = [max, max / 2, 0]
  const barH = (v: number) => (v > 0 ? Math.max(3, (v / max) * height) : 0)
  const activeGroup = active !== null ? groups[active] : null

  return (
    <figure className="relative">
      <div className="overflow-x-auto pt-3 pb-1">
        <div className="relative flex" style={{ minWidth: groups.length * minColumnWidth + 48 }}>
          {/* y-axis */}
          <div className="relative w-12 shrink-0" style={{ height }} aria-hidden>
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute right-2 -translate-y-1/2 text-xs text-subtle tabular-nums"
                style={{ top: height - (t / max) * height }}
              >
                {formatCompact(t)}
              </span>
            ))}
          </div>

          <div className="relative flex-1">
            {/* gridlines */}
            <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height }} aria-hidden>
              {ticks.map((t) => (
                <div
                  key={t}
                  className={cn('absolute inset-x-0 border-t', t === 0 ? 'border-border-strong' : 'border-dashed border-border')}
                  style={{ top: height - (t / max) * height }}
                />
              ))}
            </div>

            <div className="relative flex items-end" style={{ height }}>
              {groups.map((g, i) => {
                const dim = dimUnhighlighted && !g.highlighted
                const Tag = g.onSelect ? 'button' : 'div'
                return (
                  <Tag
                    key={g.key}
                    type={g.onSelect ? 'button' : undefined}
                    onClick={g.onSelect}
                    tabIndex={0}
                    aria-label={`${g.title}: รายรับ ${formatCurrency(g.income, symbol)}, รายจ่าย ${formatCurrency(g.expense, symbol)}`}
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className={cn(
                      'group relative flex h-full flex-1 cursor-default items-end justify-center gap-0.5 rounded-t-md outline-none',
                      g.onSelect && 'cursor-pointer',
                      active === i && 'bg-primary-soft/70',
                      g.highlighted && dimUnhighlighted && 'bg-primary-soft/50',
                    )}
                  >
                    <span
                      className={cn('w-full max-w-4 rounded-t-[4px] bg-income-mark transition-[height,opacity] duration-500', dim && 'opacity-35')}
                      style={{ height: barH(g.income) }}
                    />
                    <span
                      className={cn('w-full max-w-4 rounded-t-[4px] bg-expense-mark transition-[height,opacity] duration-500', dim && 'opacity-35')}
                      style={{ height: barH(g.expense) }}
                    />
                  </Tag>
                )
              })}
            </div>

            {/* x labels */}
            <div className="mt-1.5 flex" aria-hidden>
              {groups.map((g) => (
                <span
                  key={g.key}
                  className={cn('flex-1 text-center text-xs tabular-nums', g.highlighted ? 'font-bold text-primary-strong' : 'text-subtle')}
                >
                  {g.label}
                </span>
              ))}
            </div>

            {/* tooltip */}
            {activeGroup && active !== null && (
              <div
                role="status"
                className="pointer-events-none absolute z-10 w-max -translate-x-1/2 rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-(--shadow-pop)"
                // Pinned to the top of the plot (inside the scroll box, so it can't be clipped)
                style={{ left: `clamp(80px, ${((active + 0.5) / groups.length) * 100}%, calc(100% - 80px))`, top: 4 }}
              >
                <p className="mb-1 font-semibold text-text">{activeGroup.title}</p>
                <p className="flex items-center justify-between gap-4 text-muted">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-income-mark" />รายรับ</span>
                  <span className="font-semibold text-text tabular-nums">{formatCurrency(activeGroup.income, symbol)}</span>
                </p>
                <p className="flex items-center justify-between gap-4 text-muted">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-expense-mark" />รายจ่าย</span>
                  <span className="font-semibold text-text tabular-nums">{formatCurrency(activeGroup.expense, symbol)}</span>
                </p>
                <p className="mt-1 flex justify-between gap-4 border-t border-border pt-1 text-muted">
                  <span>สุทธิ</span>
                  <span className={cn('font-bold tabular-nums', activeGroup.income - activeGroup.expense < 0 ? 'text-danger' : 'text-income')}>
                    {activeGroup.income - activeGroup.expense < 0 ? '−' : '+'}
                    {formatCurrency(Math.abs(activeGroup.income - activeGroup.expense), symbol)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th>ช่วง</th><th>รายรับ</th><th>รายจ่าย</th></tr></thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.key}><td>{g.title}</td><td>{formatCurrency(g.income, symbol)}</td><td>{formatCurrency(g.expense, symbol)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
