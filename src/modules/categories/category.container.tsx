'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLedger } from '@/common/contexts/LedgerContext'
import { createCategory, updateCategory, deleteCategory } from './category.service'
import { cn } from '@/lib/cn'
import type { Category, Categories } from '@/common/type/interface'

const PRESET_COLORS = [
  '#ef4444','#f97316','#eab308','#22c55e','#10b981',
  '#06b6d4','#3b82f6','#6366f1','#8b5cf6','#ec4899',
  '#64748b','#0ea5e9',
]
const PRESET_ICONS = [
  '🍜','🍕','☕','🏠','🚗','✈️','💊','🎮','📚','👕',
  '💼','💡','📈','➕','➖','🎵','🛒','💰','🏋️','🎁',
  '🐶','💻','🎬','📱','🏥','🚌','🌿','🎓',
]

interface EditState { id: string; name: string; icon: string; color: string }

function CategoryForm({ title, name, setName, icon, setIcon, color, setColor, onSave, onCancel, saving }: {
  title: string; name: string; setName: (v: string) => void
  icon: string; setIcon: (v: string) => void; color: string; setColor: (v: string) => void
  onSave: () => void; onCancel: () => void; saving: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border-2 border-primary/15 bg-primary/5 p-4 space-y-4 mt-2">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">{title}</p>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">ชื่อหมวดหมู่</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น อาหาร, เดินทาง..."
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-text placeholder:text-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">ไอคอน</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_ICONS.map((ic) => (
              <motion.button key={ic} type="button" onClick={() => setIcon(ic)} whileTap={{ scale: 0.9 }}
                className={cn('h-9 w-9 rounded-xl text-lg transition-all', icon === ic ? 'bg-primary/12 ring-2 ring-primary' : 'bg-surface hover:bg-bg')}>
                {ic}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">สี</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <motion.button key={c} type="button" onClick={() => setColor(c)} whileTap={{ scale: 0.85 }}
                className={cn('h-7 w-7 rounded-full transition-all', color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105')}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 rounded-xl bg-surface border border-border px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${color}15` }}>
            {icon || '?'}
          </div>
          <span className="text-sm font-semibold" style={{ color }}>{name || 'ชื่อหมวดหมู่'}</span>
        </div>

        <div className="flex gap-2">
          <motion.button onClick={onSave} disabled={saving || !name.trim() || !icon} whileTap={{ scale: 0.97 }}
            className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 transition-colors">
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </motion.button>
          <button onClick={onCancel} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-bg transition-colors">
            ยกเลิก
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function CategoryContainer() {
  const { categories } = useLedger()
  const [local, setLocal]           = useState<Categories | null>(categories)
  const [tab, setTab]               = useState<'expense' | 'income'>('expense')
  const [editState, setEdit]        = useState<EditState | null>(null)
  const [addOpen, setAddOpen]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [addName, setAddName]       = useState('')
  const [addIcon, setAddIcon]       = useState('💰')
  const [addColor, setAddColor]     = useState('#6366f1')
  const [editName, setEditName]     = useState('')
  const [editIcon, setEditIcon]     = useState('')
  const [editColor, setEditColor]   = useState('')

  const cats = local ?? categories
  const list = tab === 'income' ? cats?.income ?? [] : cats?.expense ?? []

  function openEdit(cat: Category) {
    setEdit({ id: cat.id, name: cat.name, icon: cat.icon, color: cat.color })
    setEditName(cat.name); setEditIcon(cat.icon); setEditColor(cat.color)
    setAddOpen(false)
  }

  async function handleAdd() {
    if (!addName.trim() || !addIcon) return
    setSaving(true)
    try {
      setLocal(await createCategory(tab, { name: addName.trim(), icon: addIcon, color: addColor }))
      toast.success(`เพิ่มหมวดหมู่ "${addName.trim()}" สำเร็จ`)
      setAddName(''); setAddIcon('💰'); setAddColor('#6366f1'); setAddOpen(false)
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally { setSaving(false) }
  }

  async function handleEdit() {
    if (!editState || !editName.trim()) return
    setSaving(true)
    try {
      setLocal(await updateCategory(editState.id, { name: editName.trim(), icon: editIcon, color: editColor }))
      toast.success('แก้ไขหมวดหมู่สำเร็จ')
      setEdit(null)
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string, name: string) {
    toast(`ลบ "${name}" ใช่ไหม?`, {
      action: { label: 'ลบ', onClick: async () => {
        try {
          setLocal(await deleteCategory(id))
          toast.success(`ลบ "${name}" สำเร็จ`)
          if (editState?.id === id) setEdit(null)
        } catch {
          toast.error('ลบไม่สำเร็จ')
        }
      }},
      cancel: { label: 'ยกเลิก', onClick: () => {} },
    })
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex rounded-2xl bg-bg border border-border p-1 gap-1">
        {(['expense', 'income'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setEdit(null); setAddOpen(false) }}
            className={cn('flex-1 rounded-xl py-2 text-sm font-semibold transition-all',
              tab === t
                ? t === 'income' ? 'bg-surface text-income shadow-sm' : 'bg-surface text-expense shadow-sm'
                : 'text-muted hover:text-text'
            )}>
            {t === 'income' ? '↑ รายรับ' : '↓ รายจ่าย'}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-text">{list.length} หมวดหมู่</span>
          <motion.button onClick={() => { setAddOpen((v) => !v); setEdit(null) }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
            <Plus size={12} strokeWidth={2.5} /> เพิ่มหมวดหมู่
          </motion.button>
        </div>

        {list.length === 0
          ? <p className="py-10 text-center text-sm text-muted">ยังไม่มีหมวดหมู่</p>
          : (
            <div className="p-2">
              {list.map((cat, i) => (
                <motion.div key={cat.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-bg rounded-xl group transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${cat.color}15` }}>
                      {cat.icon}
                    </div>
                    <span className="flex-1 text-sm font-medium text-text">{cat.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(cat)} className="rounded-lg p-1.5 text-muted hover:bg-gray-100 hover:text-text transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(cat.id, cat.name)} className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-expense transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {editState?.id === cat.id && (
                      <CategoryForm title="แก้ไขหมวดหมู่" name={editName} setName={setEditName}
                        icon={editIcon} setIcon={setEditIcon} color={editColor} setColor={setEditColor}
                        onSave={handleEdit} onCancel={() => setEdit(null)} saving={saving} />
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )
        }
      </div>

      <AnimatePresence>
        {addOpen && (
          <CategoryForm title={`เพิ่มหมวดหมู่${tab === 'income' ? 'รายรับ' : 'รายจ่าย'}`}
            name={addName} setName={setAddName} icon={addIcon} setIcon={setAddIcon}
            color={addColor} setColor={setAddColor} onSave={handleAdd} onCancel={() => setAddOpen(false)} saving={saving} />
        )}
      </AnimatePresence>
    </div>
  )
}
