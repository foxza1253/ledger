'use client'

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import { useHydrated } from '@/common/hooks/use-hydrated'
import { addMonths, currentYearMonth, getMonthKey } from '@/lib/date'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  label: new Date(2000, i, 1).toLocaleDateString('th-TH', { month: 'long' }),
  value: i + 1,
}))

export default function MonthPicker() {
  const { year, month, setYearMonth } = useLedger()
  const hydrated = useHydrated()
  if (!hydrated) return <div className="skeleton h-11 w-60 rounded-xl" aria-hidden />
  return <MonthPickerInner year={year} month={month} setYearMonth={setYearMonth} />
}

function MonthPickerInner({ year, month, setYearMonth }: { year: number; month: number; setYearMonth: (y: number, m: number) => void }) {
  const now = currentYearMonth()
  const isCurrent = year === now.year && month === now.month
  const years = Array.from({ length: 7 }, (_, i) => now.year - 5 + i)
  if (!years.includes(year)) years.unshift(year)

  function shift(delta: number) {
    const next = addMonths(year, month, delta)
    setYearMonth(next.year, next.month)
  }

  const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary-strong'

  return (
    <div className="flex items-center gap-1.5">
      {!isCurrent && (
        <button
          type="button"
          onClick={() => setYearMonth(now.year, now.month)}
          className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-primary-strong hover:bg-primary-soft"
        >
          เดือนนี้
        </button>
      )}
      <div className="flex items-center rounded-xl border border-border-strong bg-surface p-0.5 shadow-(--shadow-card)">
        <button type="button" onClick={() => shift(-1)} className={iconBtn} aria-label="เดือนก่อนหน้า">
          <ChevronLeft size={18} />
        </button>
        <div className="relative">
          <label htmlFor="month-picker" className="sr-only">เลือกเดือน</label>
          <select
            id="month-picker"
            value={getMonthKey(year, month)}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number)
              setYearMonth(y, m)
            }}
            className="cursor-pointer appearance-none bg-transparent py-1.5 pr-7 pl-2 text-sm font-semibold text-text focus:outline-none"
          >
            {years.flatMap((y) =>
              MONTHS.map(({ label, value }) => (
                <option key={`${y}-${value}`} value={getMonthKey(y, value)}>
                  {label} {y + 543}
                </option>
              )),
            )}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-muted" />
        </div>
        <button type="button" onClick={() => shift(1)} className={iconBtn} aria-label="เดือนถัดไป">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
