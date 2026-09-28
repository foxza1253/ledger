'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { toast } from 'sonner'
import { currentYearMonth } from '@/lib/date'
import { authApi, errorMessage } from '@/lib/api-client'
import { fetchCategories } from '@/modules/categories/category.service'
import { fetchSettings } from '@/modules/settings/settings.service'
import { DEFAULT_SETTINGS } from '@/common/type/interface'
import type { Settings, Categories, Category } from '@/common/type/interface'

export interface Account {
  mode: 'supabase' | 'password' | 'disabled'
  email: string | null
}

interface LedgerContextValue {
  account: Account | null
  logout: () => Promise<void>
  year: number
  month: number
  setYearMonth: (year: number, month: number) => void
  settings: Settings | null
  setSettings: (settings: Settings) => void
  categories: Categories | null
  setCategories: (categories: Categories) => void
  findCategory: (id: string) => Category | undefined
  /** Currency symbol with a sensible fallback while settings load. */
  symbol: string
}

const LedgerContext = createContext<LedgerContextValue | null>(null)

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [{ year, month }, setPeriod] = useState(currentYearMonth)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [categories, setCategories] = useState<Categories | null>(null)
  const [account, setAccount] = useState<Account | null>(null)

  useEffect(() => {
    authApi<{ mode: Account['mode']; user: { email: string | null } | null }>('/session')
      .then((d) => setAccount({ mode: d.mode, email: d.user?.email ?? null }))
      .catch(() => {})
    fetchSettings()
      .then(setSettings)
      .catch((err) => {
        setSettings(DEFAULT_SETTINGS)
        toast.error(errorMessage(err, 'โหลดการตั้งค่าไม่สำเร็จ — ใช้ค่าเริ่มต้น'))
      })
    fetchCategories()
      .then(setCategories)
      .catch((err) => {
        setCategories({ income: [], expense: [] })
        toast.error(errorMessage(err, 'โหลดหมวดหมู่ไม่สำเร็จ'))
      })
  }, [])

  const value = useMemo<LedgerContextValue>(() => {
    const byId = new Map<string, Category>()
    for (const c of [...(categories?.income ?? []), ...(categories?.expense ?? [])]) byId.set(c.id, c)
    return {
      account,
      logout: async () => {
        await authApi('/logout', { method: 'POST' }).catch(() => {})
        window.location.assign('/login')
      },
      year,
      month,
      setYearMonth: (y, m) => setPeriod({ year: y, month: m }),
      settings,
      setSettings,
      categories,
      setCategories,
      findCategory: (id) => byId.get(id),
      symbol: settings?.currencySymbol ?? '฿',
    }
  }, [account, year, month, settings, categories])

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
}

export function useLedger() {
  const ctx = useContext(LedgerContext)
  if (!ctx) throw new Error('useLedger must be used inside LedgerProvider')
  return ctx
}
