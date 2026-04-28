'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { currentYearMonth } from '@/lib/date'
import type { Settings, Categories } from '@/common/type/interface'

interface LedgerContextValue {
  year: number
  month: number
  setYearMonth: (year: number, month: number) => void
  settings: Settings | null
  categories: Categories | null
}

const LedgerContext = createContext<LedgerContextValue | null>(null)

const DEFAULT_SETTINGS: Settings = {
  currency: 'THB',
  currencySymbol: '฿',
  locale: 'th-TH',
  monthlyBudget: { enabled: true, amount: 30000 },
  startDayOfMonth: 1,
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const { year: currentYear, month: currentMonth } = currentYearMonth()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [categories, setCategories] = useState<Categories | null>(null)

  useEffect(() => {
    fetch('/api/ledger/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings ?? DEFAULT_SETTINGS))
      .catch(() => setSettings(DEFAULT_SETTINGS))

    fetch('/api/ledger/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? null))
      .catch(() => {})
  }, [])

  function setYearMonth(y: number, m: number) {
    setYear(y)
    setMonth(m)
  }

  return (
    <LedgerContext.Provider value={{ year, month, setYearMonth, settings, categories }}>
      {children}
    </LedgerContext.Provider>
  )
}

export function useLedger() {
  const ctx = useContext(LedgerContext)
  if (!ctx) throw new Error('useLedger must be used inside LedgerProvider')
  return ctx
}
