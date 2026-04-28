'use client'

import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import SummaryCard from '@/components/ui/SummaryCard'
import { fetchMonthlySummary } from './monthly.service'
import { formatCurrency } from '@/common/utils/currency'
import type { MonthlySummary, Category } from '@/common/type/interface'

function BarRow({ label, icon, value, max, color }: { label: string; icon: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-6 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-text truncate">{label}</span>
          <span className="text-xs font-semibold text-muted tabular-nums ml-2 shrink-0">
            {formatCurrency(value, '฿')}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-bg">
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  )
}

function DailyChart({ breakdown, symbol }: { breakdown: { date: string; income: number; expense: number }[]; symbol: string }) {
  const maxVal = Math.max(...breakdown.flatMap((d) => [d.income, d.expense]), 1)
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1.5 min-w-max pb-5 px-1" style={{ minHeight: 110 }}>
        {breakdown.map((d) => {
          const incH = Math.round((d.income  / maxVal) * 80)
          const expH = Math.round((d.expense / maxVal) * 80)
          const day  = new Date(d.date).getDate()
          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5" style={{ height: 84 }}>
                {d.income  > 0 && <div className="w-3 rounded-t-sm bg-emerald-300 transition-all" style={{ height: incH }} title={`รายรับ ${formatCurrency(d.income, symbol)}`} />}
                {d.expense > 0 && <div className="w-3 rounded-t-sm bg-rose-300   transition-all" style={{ height: expH }} title={`รายจ่าย ${formatCurrency(d.expense, symbol)}`} />}
                {d.income === 0 && d.expense === 0 && <div className="w-3" />}
              </div>
              <span className="text-[10px] text-muted">{day}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-muted"><span className="h-2 w-3 rounded-sm bg-emerald-300 inline-block" /> รายรับ</span>
        <span className="flex items-center gap-1.5 text-xs text-muted"><span className="h-2 w-3 rounded-sm bg-rose-300   inline-block" /> รายจ่าย</span>
      </div>
    </div>
  )
}

export default function MonthlySummaryContainer() {
  const { year, month, settings, categories } = useLedger()
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchMonthlySummary(year, month).then(setSummary).finally(() => setLoading(false))
  }, [year, month])

  const symbol  = settings?.currencySymbol ?? '฿'
  const allCats = categories ? [...categories.income, ...categories.expense] : [] as Category[]
  const getCat  = (id: string) => allCats.find((c) => c.id === id)

  const makeBars = (type: 'income' | 'expense') =>
    (summary?.byCategory ?? [])
      .filter((b) => categories?.[type].some((c) => c.id === b.categoryId))
      .sort((a, b) => b.total - a.total)
      .map((b) => { const cat = getCat(b.categoryId)!; return { label: cat?.name ?? '', icon: cat?.icon ?? '', value: b.total, color: cat?.color ?? '#ccc' } })

  const expBars = makeBars('expense')
  const incBars = makeBars('income')
  const hasData = (summary?.totalIncome ?? 0) > 0 || (summary?.totalExpense ?? 0) > 0

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-surface border border-border shadow-sm" />)}</div>
      <div className="h-48 rounded-2xl bg-surface border border-border shadow-sm" />
    </div>
  )

  const card = "rounded-2xl bg-surface border border-border shadow-sm p-5"

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="รายรับ"  amount={summary?.totalIncome  ?? 0} type="income"  symbol={symbol} />
        <SummaryCard label="รายจ่าย" amount={summary?.totalExpense ?? 0} type="expense" symbol={symbol} />
        <SummaryCard label="คงเหลือ" amount={summary?.balance      ?? 0} type="balance" symbol={symbol} />
      </div>

      {!hasData ? (
        <div className={`${card} flex flex-col items-center justify-center py-16 text-muted`}>
          <CalendarDays size={40} strokeWidth={1.5} className="mb-3 text-border" />
          <p className="text-sm">ยังไม่มีข้อมูลในเดือนนี้</p>
        </div>
      ) : (
        <>
          {(summary?.dailyBreakdown?.length ?? 0) > 0 && (
            <div className={card}>
              <h2 className="text-sm font-semibold text-text mb-4">รายวัน</h2>
              <DailyChart breakdown={summary!.dailyBreakdown} symbol={symbol} />
            </div>
          )}

          {expBars.length > 0 && (
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text">รายจ่ายตามหมวดหมู่</h2>
                <span className="text-xs font-semibold text-expense">{formatCurrency(summary?.totalExpense ?? 0, symbol)}</span>
              </div>
              <div className="space-y-3">
                {expBars.map((b) => <BarRow key={b.label} {...b} max={expBars[0].value} />)}
              </div>
            </div>
          )}

          {incBars.length > 0 && (
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text">รายรับตามหมวดหมู่</h2>
                <span className="text-xs font-semibold text-income">{formatCurrency(summary?.totalIncome ?? 0, symbol)}</span>
              </div>
              <div className="space-y-3">
                {incBars.map((b) => <BarRow key={b.label} {...b} max={incBars[0].value} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
