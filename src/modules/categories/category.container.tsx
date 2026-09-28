'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Pencil, Plus, Tag, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useLedger } from '@/common/contexts/LedgerContext'
import { errorMessage } from '@/lib/api-client'
import { cn } from '@/lib/cn'
import CategoryIcon from '@/components/ui/CategoryIcon'
import EmptyState from '@/components/ui/EmptyState'
import { createCategory, updateCategory, deleteCategory } from './category.service'
import type { Category, CategoryType } from '@/common/type/interface'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b', '#0ea5e9',
]
const PRESET_ICONS = [
  '🍜', '🍕', '☕', '🏠', '🚗', '✈️', '💊', '🎮', '📚', '👕',
  '💼', '💡', '📈', '➕', '➖', '🎵', '🛒', '💰', '🏋️', '🎁',
  '🐶', '💻', '🎬', '📱', '🏥', '🚌', '🌿', '🎓',
]

interface Draft { name: string; icon: string; color: string }
const EMPTY_DRAFT: Draft = { name: '', icon: '💰', color: '#ec4899' }

function CategoryForm({ title, initial, onSave, onCancel }: {
  title: string
  initial: Draft
  onSave: (draft: Draft) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const canSave = draft.name.trim().length > 0 && !!draft.icon

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ ...draft, name: draft.name.trim() })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="m-2 space-y-4 rounded-2xl bg-primary-soft/60 p-4 ring-1 ring-inset ring-primary-muted">
        <p className="text-sm font-bold text-primary-strong">{title}</p>

        <div className="flex items-center gap-3">
          <CategoryIcon category={{ id: 'preview', ...draft }} size="lg" />
          <div className="flex-1">
            <label htmlFor={`${title}-name`} className="mb-1.5 block text-sm font-semibold text-text">ชื่อหมวดหมู่</label>
            <input id={`${title}-name`} type="text" value={draft.name} maxLength={40} autoFocus
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="เช่น อาหาร, เดินทาง..." className="field-input" />
          </div>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-text">ไอคอน</legend>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_ICONS.map((ic) => (
              <button key={ic} type="button" onClick={() => setDraft({ ...draft, icon: ic })} aria-pressed={draft.icon === ic}
                className={cn('h-10 w-10 rounded-xl text-xl transition-all',
                  draft.icon === ic ? 'bg-surface shadow-sm ring-2 ring-primary' : 'bg-surface/60 hover:bg-surface')}>
                {ic}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-text">สีประจำหมวด</legend>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setDraft({ ...draft, color: c })}
                aria-label={`สี ${c}`} aria-pressed={draft.color === c}
                className={cn('h-8 w-8 rounded-full transition-transform',
                  draft.color === c ? 'scale-110 ring-2 ring-text ring-offset-2' : 'hover:scale-105')}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </fieldset>

        <div className="flex gap-2">
          <button type="submit" disabled={saving || !canSave} className="btn-primary flex-1">
            {saving ? <><Loader2 size={14} className="animate-spin" /> กำลังบันทึก...</> : 'บันทึก'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">ยกเลิก</button>
        </div>
      </div>
    </motion.form>
  )
}

export default function CategoryContainer() {
  const { categories, setCategories } = useLedger()
  const [tab, setTab] = useState<CategoryType>('expense')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const list = categories?.[tab] ?? []

  async function handleAdd(draft: Draft) {
    try {
      setCategories(await createCategory(tab, draft))
      toast.success(`เพิ่มหมวดหมู่ "${draft.name}" สำเร็จ`)
      setAddOpen(false)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function handleEdit(id: string, draft: Draft) {
    try {
      setCategories(await updateCategory(id, draft))
      toast.success('แก้ไขหมวดหมู่สำเร็จ')
      setEditingId(null)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  function handleDelete(cat: Category) {
    toast(`ลบหมวดหมู่ "${cat.name}"?`, {
      description: 'ลบได้เฉพาะหมวดหมู่ที่ยังไม่มีรายการใช้งาน',
      action: {
        label: 'ลบ',
        onClick: async () => {
          try {
            setCategories(await deleteCategory(cat.id))
            toast.success(`ลบ "${cat.name}" สำเร็จ`)
            if (editingId === cat.id) setEditingId(null)
          } catch (err) {
            toast.error(errorMessage(err, 'ลบไม่สำเร็จ'))
          }
        },
      },
      cancel: { label: 'ยกเลิก', onClick: () => {} },
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface p-1.5 shadow-(--shadow-card) ring-1 ring-inset ring-border" role="tablist">
        {(['expense', 'income'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t}
            onClick={() => { setTab(t); setEditingId(null); setAddOpen(false) }}
            className={cn('flex items-center justify-center gap-2 rounded-xl py-2.5 text-[15px] font-semibold transition-all',
              tab === t
                ? t === 'income' ? 'bg-income-soft text-income ring-1 ring-income/20' : 'bg-expense-soft text-expense ring-1 ring-expense/20'
                : 'text-muted hover:text-text')}>
            {t === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {t === 'income' ? 'รายรับ' : 'รายจ่าย'}
            <span className="rounded-full bg-surface px-1.5 text-xs ring-1 ring-border">{categories?.[t].length ?? 0}</span>
          </button>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-base font-semibold text-text">หมวดหมู่{tab === 'income' ? 'รายรับ' : 'รายจ่าย'}</h2>
          <button onClick={() => { setAddOpen((v) => !v); setEditingId(null) }} className="btn-primary px-3 py-2" aria-expanded={addOpen}>
            <Plus size={15} strokeWidth={2.5} /> เพิ่ม
          </button>
        </div>

        <AnimatePresence>
          {addOpen && (
            <CategoryForm key={`add-${tab}`} title={`เพิ่มหมวดหมู่${tab === 'income' ? 'รายรับ' : 'รายจ่าย'}`}
              initial={EMPTY_DRAFT} onSave={handleAdd} onCancel={() => setAddOpen(false)} />
          )}
        </AnimatePresence>

        {!categories ? (
          <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-12" />)}</div>
        ) : list.length === 0 ? (
          <EmptyState icon={Tag} title="ยังไม่มีหมวดหมู่" description="กด “เพิ่ม” เพื่อสร้างหมวดหมู่แรก" />
        ) : (
          <ul className="divide-y divide-border">
            {list.map((cat) => (
              <li key={cat.id}>
                <div className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-bg/60">
                  <CategoryIcon category={cat} />
                  <span className="flex-1 truncate text-[15px] font-medium text-text">{cat.name}</span>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} aria-hidden />
                  <div className="flex items-center gap-1 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                    <button onClick={() => { setEditingId(cat.id); setAddOpen(false) }} aria-label={`แก้ไข ${cat.name}`}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-primary-soft hover:text-primary-strong">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(cat)} aria-label={`ลบ ${cat.name}`}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-danger-soft hover:text-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {editingId === cat.id && (
                    <CategoryForm key={`edit-${cat.id}`} title="แก้ไขหมวดหมู่" initial={{ name: cat.name, icon: cat.icon, color: cat.color }}
                      onSave={(d) => handleEdit(cat.id, d)} onCancel={() => setEditingId(null)} />
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
