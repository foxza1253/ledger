'use client'

import { useState } from 'react'
import { Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useLedger } from '@/common/contexts/LedgerContext'
import { errorMessage } from '@/lib/api-client'
import { CURRENCY_SYMBOLS } from '@/common/utils/currency'
import { cn } from '@/lib/cn'
import { saveSettings } from './settings.service'
import type { Settings } from '@/common/type/interface'

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  )
}

function Row({ label, htmlFor, sub, children }: { label: string; htmlFor?: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <label htmlFor={htmlFor} className="text-[15px] font-medium text-text">{label}</label>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const CURRENCIES = [
  { code: 'THB', label: 'บาทไทย' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'GBP', label: 'British Pound' },
]

function SettingsForm({ initial }: { initial: Settings }) {
  const { setSettings } = useLedger()
  const [local, setLocal] = useState<Settings>(initial)
  const [saving, setSaving] = useState(false)
  const dirty = JSON.stringify(local) !== JSON.stringify(initial)

  async function handleSave() {
    setSaving(true)
    try {
      setSettings(await saveSettings(local))
      toast.success('บันทึกการตั้งค่าสำเร็จ')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const budgetOn = local.monthlyBudget.enabled

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Section title="สกุลเงิน" description="ใช้แสดงผลจำนวนเงินทั่วทั้งแอป">
        <Row label="สกุลเงิน" htmlFor="currency">
          <select id="currency" value={local.currency} className="field-input w-auto py-2"
            onChange={(e) => setLocal({ ...local, currency: e.target.value, currencySymbol: CURRENCY_SYMBOLS[e.target.value] ?? local.currencySymbol })}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.label}</option>)}
          </select>
        </Row>
        <Row label="สัญลักษณ์" htmlFor="symbol" sub="แสดงหน้าตัวเลข">
          <input id="symbol" type="text" value={local.currencySymbol} maxLength={4}
            onChange={(e) => setLocal({ ...local, currencySymbol: e.target.value })}
            className="field-input w-20 py-2 text-center" />
        </Row>
      </Section>

      <Section title="งบประมาณรายเดือน" description="แจ้งเตือนเมื่อใช้จ่ายใกล้หรือเกินงบบนหน้าภาพรวม">
        <Row label="เปิดใช้งานงบประมาณ">
          <button type="button" role="switch" aria-checked={budgetOn} aria-label="เปิดใช้งานงบประมาณ"
            onClick={() => setLocal({ ...local, monthlyBudget: { ...local.monthlyBudget, enabled: !budgetOn } })}
            className={cn('relative inline-flex h-7 w-12 items-center rounded-full transition-colors', budgetOn ? 'bg-primary' : 'bg-border-strong')}>
            <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', budgetOn ? 'translate-x-6' : 'translate-x-1')} />
          </button>
        </Row>
        {budgetOn && (
          <Row label={`งบประมาณต่อเดือน (${local.currencySymbol})`} htmlFor="budget">
            <input id="budget" type="number" inputMode="decimal" value={local.monthlyBudget.amount} min="0" step="500"
              onChange={(e) => setLocal({ ...local, monthlyBudget: { ...local.monthlyBudget, amount: Math.max(0, Number(e.target.value) || 0) } })}
              className="field-input w-40 py-2 text-right tabular-nums" />
          </Row>
        )}
      </Section>

      <div className="sticky bottom-24 z-10 lg:bottom-4">
        <button onClick={handleSave} disabled={saving || !dirty} className="btn-primary w-full py-3 text-[15px] shadow-(--shadow-pop)">
          {saving ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</> : dirty ? 'บันทึกการตั้งค่า' : 'บันทึกแล้ว'}
        </button>
      </div>
    </div>
  )
}

function AccountSection() {
  const { account, logout } = useLedger()
  if (!account || account.mode === 'disabled') return null
  return (
    <Section title="บัญชี" description={account.mode === 'supabase' ? 'เข้าสู่ระบบด้วย Supabase Auth' : 'โหมดผู้ใช้คนเดียว'}>
      <Row label={account.email ?? 'เจ้าของบัญชี'}>
        <button type="button" onClick={logout}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-danger ring-1 ring-inset ring-danger/25 transition-colors hover:bg-danger-soft">
          <LogOut size={15} /> ออกจากระบบ
        </button>
      </Row>
    </Section>
  )
}

export default function SettingsContainer() {
  const { settings } = useLedger()
  if (!settings) {
    return <div className="mx-auto max-w-2xl space-y-5" aria-busy="true">{[0, 1].map((i) => <div key={i} className="card h-40" />)}</div>
  }
  // Re-mount the form when saved settings change so local state resets without an effect.
  return (
    <div className="space-y-5">
      <SettingsForm key={JSON.stringify(settings)} initial={settings} />
      <div className="mx-auto max-w-2xl"><AccountSection /></div>
    </div>
  )
}
