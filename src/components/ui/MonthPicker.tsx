'use client'

import { ChevronDown } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import { getMonthKey } from '@/lib/date'

export default function MonthPicker() {
  const { year, month, setYearMonth } = useLedger()

  const months = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2000, i, 1).toLocaleDateString('th-TH', { month: 'short' }),
    value: i + 1,
  }))
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [y, m] = e.target.value.split('-').map(Number)
    setYearMonth(y, m)
  }

  return (
    <div className="relative">
      <select
        value={getMonthKey(year, month)}
        onChange={handleChange}
        className="appearance-none cursor-pointer rounded-xl border border-border bg-bg py-1.5 pl-3 pr-8 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      >
        {years.flatMap((y) =>
          months.map(({ label, value }) => (
            <option key={`${y}-${value}`} value={getMonthKey(y, value)}>
              {label} {y}
            </option>
          ))
        )}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  )
}
