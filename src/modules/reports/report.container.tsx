'use client'

import { useEffect, useState, useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import { formatCurrency } from '@/common/utils/currency'
import { getMonthKey } from '@/lib/date'
import type { MonthlySummary, Category } from '@/common/type/interface'

function DonutChart({ segments, size = 160 }: { segments: { value: number; color: string }[]; size?: number }) {
  const r = 56, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (total === 0) return null
  let offset = 0
  const slices = segments.map((seg) => {
    const pct = seg.value / total
    const dash = pct * circ
    const rotate = (offset / total) * 360 - 90
    offset += seg.value
    return { ...seg, dash, gap: circ - dash, rotate }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="26"
          strokeDasharray={`${s.dash} ${s.gap}`} transform={`rotate(${s.rotate} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={r - 13} fill="white" />
    </svg>
  )
}

function getLast6(): { year: number; month: number }[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
}

export default function ReportContainer() {
  const { year, month, settings, categories } = useLedger()
  const [summary,  setSummary]  = useState<MonthlySummary | null>(null)
  const [history,  setHistory]  = useState<(MonthlySummary | null)[]>([])
  const [loading,  setLoading]  = useState(true)
  const last6 = useMemo(getLast6, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/ledger/monthly?year=${year}&month=${month}`).then((r) => r.json()).then((d) => d.summary ?? null),
      Promise.all(last6.map((m) => fetch(`/api/ledger/monthly?year=${m.year}&month=${m.month}`).then((r) => r.json()).then((d) => d.summary ?? null).catch(() => null))),
    ])
      .then(([s, hist]) => { setSummary(s); setHistory(hist) })
      .finally(() => setLoading(false))
  }, [year, month, last6])

  const symbol  = settings?.currencySymbol ?? '฿'
  const allCats = categories ? [...categories.income, ...categories.expense] : [] as Category[]
  const getCat  = (id: string) => allCats.find((c) => c.id === id)

  const expenseSegments = useMemo(() => {
    if (!summary || !categories) return []
    return (summary.byCategory ?? [])
      .filter((b) => categories.expense.some((c) => c.id === b.categoryId))
      .sort((a, b) => b.total - a.total).slice(0, 6)
      .map((b) => { const cat = getCat(b.categoryId); return { value: b.total, color: cat?.color ?? '#94a3b8', label: cat?.name ?? '', icon: cat?.icon ?? '' } })
  }, [summary, categories])

  const maxBar = Math.max(...history.map((h) => Math.max(h?.totalIncome ?? 0, h?.totalExpense ?? 0)), 1)
  const hasData = (summary?.totalExpense ?? 0) > 0 || (summary?.totalIncome ?? 0) > 0
  const card = "rounded-2xl bg-surface border border-border shadow-sm p-5"

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => <div key={i} className={`h-36 rounded-2xl bg-surface border border-border shadow-sm`} />)}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* 6-month trend */}
      <div className={card}>
        <h2 className="text-sm font-semibold text-text mb-4">เทรนด์ 6 เดือน</h2>
        <div className="flex items-end justify-between gap-2" style={{ height: 100 }}>
          {last6.map((m, i) => {
            const h  = history[i]
            const incH = Math.round(((h?.totalIncome  ?? 0) / maxBar) * 80)
            const expH = Math.round(((h?.totalExpense ?? 0) / maxBar) * 80)
            const sel  = m.year === year && m.month === month
            return (
              <div key={getMonthKey(m.year, m.month)} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: 84 }}>
                  <div className={`w-4 rounded-t-md transition-all ${sel ? 'bg-income' : 'bg-emerald-200'}`} style={{ height: incH || 2 }} />
                  <div className={`w-4 rounded-t-md transition-all ${sel ? 'bg-expense' : 'bg-rose-200'}`}   style={{ height: expH || 2 }} />
                </div>
                <span className={`text-[10px] ${sel ? 'font-bold text-primary' : 'text-muted'}`}>
                  {new Date(m.year, m.month - 1).toLocaleDateString('th-TH', { month: 'short' })}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted"><span className="h-2 w-3 rounded-sm bg-emerald-300 inline-block" /> รายรับ</span>
          <span className="flex items-center gap-1.5 text-xs text-muted"><span className="h-2 w-3 rounded-sm bg-rose-300   inline-block" /> รายจ่าย</span>
        </div>
      </div>

      {!hasData ? (
        <div className={`${card} flex flex-col items-center justify-center py-16 text-muted`}>
          <TrendingUp size={40} strokeWidth={1.5} className="mb-3 text-border" />
          <p className="text-sm">ยังไม่มีข้อมูลในเดือนที่เลือก</p>
        </div>
      ) : (
        <>
          {expenseSegments.length > 0 && (
            <div className={card}>
              <h2 className="text-sm font-semibold text-text mb-4">สัดส่วนรายจ่าย</h2>
              <div className="flex items-center gap-6">
                <div className="shrink-0"><DonutChart segments={expenseSegments} /></div>
                <div className="flex-1 space-y-2.5 min-w-0">
                  {expenseSegments.map((seg) => {
                    const pct = ((seg.value / (summary?.totalExpense ?? 1)) * 100).toFixed(1)
                    return (
                      <div key={seg.label} className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text truncate">{seg.icon} {seg.label}</span>
                            <span className="text-xs font-semibold text-muted ml-2 shrink-0">{pct}%</span>
                          </div>
                          <p className="text-xs text-muted tabular-nums">{formatCurrency(seg.value, symbol)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className={card}>
            <h2 className="text-sm font-semibold text-text mb-4">สรุปเดือนนี้</h2>
            <div className="space-y-3">
              {[
                { label: 'รายรับรวม',  value: summary?.totalIncome  ?? 0, color: '#10b981' },
                { label: 'รายจ่ายรวม', value: summary?.totalExpense ?? 0, color: '#f43f5e' },
              ].map((row) => {
                const max = Math.max(summary?.totalIncome ?? 0, summary?.totalExpense ?? 0, 1)
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text">{row.label}</span>
                        <span className="text-xs font-semibold text-muted tabular-nums">{formatCurrency(row.value, symbol)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-bg">
                        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-semibold text-text">คงเหลือ</span>
                <span className={`text-sm font-bold tabular-nums ${(summary?.balance ?? 0) >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatCurrency(summary?.balance ?? 0, symbol)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
