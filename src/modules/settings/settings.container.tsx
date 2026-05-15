'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLedger } from '@/common/contexts/LedgerContext'
import type { Settings } from '@/common/type/interface'

async function saveSettings(data: Partial<Settings>): Promise<Settings> {
  const res = await fetch('/api/ledger/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return (await res.json()).settings
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border">
        <h2 className="text-sm font-semibold text-text">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const selectClass = "rounded-xl border border-border bg-bg px-3 py-1.5 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"

export default function SettingsContainer() {
  const { settings } = useLedger()
  const [local, setLocal] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (settings) setLocal({ ...settings }) }, [settings])

  if (!local) return (
    <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-surface border border-border shadow-sm" />)}
    </div>
  )

  async function handleSave() {
    if (!local) return
    setSaving(true)
    try {
      await saveSettings(local)
      toast.success('บันทึกการตั้งค่าสำเร็จ')
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-lg space-y-4">
      <Section title="สกุลเงิน">
        <Row label="สกุลเงิน" sub="ใช้แสดงทั่วทั้งแอป">
          <select value={local.currency} onChange={(e) => setLocal({ ...local, currency: e.target.value })} className={selectClass}>
            <option value="THB">THB — บาทไทย</option>
            <option value="USD">USD — US Dollar</option>
            <option value="JPY">JPY — Japanese Yen</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </Row>
        <Row label="สัญลักษณ์" sub="แสดงหน้าตัวเลข">
          <input type="text" value={local.currencySymbol} onChange={(e) => setLocal({ ...local, currencySymbol: e.target.value })} maxLength={4}
            className={`${selectClass} w-16 text-center`} />
        </Row>
      </Section>

      <Section title="งบประมาณรายเดือน">
        <Row label="เปิดใช้งาน" sub="แสดง progress bar บน Dashboard">
          <button
            onClick={() => setLocal({ ...local, monthlyBudget: { ...local.monthlyBudget, enabled: !local.monthlyBudget.enabled } })}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${local.monthlyBudget.enabled ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${local.monthlyBudget.enabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </Row>
        {local.monthlyBudget.enabled && (
          <Row label="งบประมาณ (฿ / เดือน)">
            <input type="number" value={local.monthlyBudget.amount} min="0" step="1000"
              onChange={(e) => setLocal({ ...local, monthlyBudget: { ...local.monthlyBudget, amount: parseFloat(e.target.value) || 0 } })}
              className={`${selectClass} w-32 text-right`} />
          </Row>
        )}
      </Section>

      <Section title="การแสดงผล">
        <Row label="วันเริ่มต้นของเดือน" sub="วันที่ถือเป็นต้นเดือน">
          <select value={local.startDayOfMonth} onChange={(e) => setLocal({ ...local, startDayOfMonth: parseInt(e.target.value) })} className={selectClass}>
            {[1, 15, 25].map((d) => <option key={d} value={d}>วันที่ {d}</option>)}
          </select>
        </Row>
      </Section>

      <motion.button onClick={handleSave} disabled={saving} whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm shadow-primary/10"
      >
        {saving ? <><Loader2 size={14} className="animate-spin" /> กำลังบันทึก...</> : 'บันทึกการตั้งค่า'}
      </motion.button>
    </div>
  )
}
