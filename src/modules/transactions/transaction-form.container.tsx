'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Loader2, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { useLedger } from '@/common/contexts/LedgerContext'
import { todayString } from '@/lib/date'
import { cn } from '@/lib/cn'
import { createTransaction, updateTransaction, deleteTransaction } from './transaction.service'
import type { Transaction, TransactionType } from '@/common/type/interface'

interface TransactionFormProps { initial?: Transaction }

export default function TransactionFormContainer({ initial }: TransactionFormProps) {
  const router = useRouter()
  const { categories } = useLedger()

  const [type, setType]               = useState<TransactionType>(initial?.type ?? 'expense')
  const [date, setDate]               = useState(initial?.date ?? todayString())
  const [categoryId, setCategoryId]   = useState(initial?.categoryId ?? '')
  const [amount, setAmount]           = useState(initial?.amount?.toString() ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [note, setNote]               = useState(initial?.note ?? '')
  const [saving, setSaving]           = useState(false)
  const [showDelete, setShowDelete]   = useState(false)
  const [deleting, setDeleting]       = useState(false)

  const categoryList = categories ? categories[type] : []
  const isValid = !!categoryId && parseFloat(amount) > 0 && description.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    try {
      const payload = { date, type, categoryId, amount: parseFloat(amount), description: description.trim(), note: note.trim() }
      if (initial) {
        await updateTransaction(initial.id, initial.date, payload)
        toast.success('แก้ไขรายการสำเร็จ')
      } else {
        await createTransaction(payload)
        toast.success('บันทึกรายการสำเร็จ')
      }
      router.push('/transactions')
      router.refresh()
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!initial) return
    setDeleting(true)
    try {
      await deleteTransaction(initial.id, initial.date)
      toast.success('ลบรายการสำเร็จ')
      router.push('/transactions')
      router.refresh()
    } catch {
      toast.error('ลบไม่สำเร็จ กรุณาลองใหม่')
    } finally { setDeleting(false) }
  }

  const fieldClass = 'rounded-2xl bg-surface border border-border px-5 py-4 shadow-sm'
  const inputClass = 'w-full bg-transparent focus:outline-none'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-lg"
    >
      <Link href="/transactions" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text mb-6 transition-colors">
        <ChevronLeft size={16} /> กลับ
      </Link>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Type toggle */}
        <div className="flex rounded-2xl bg-bg border border-border p-1 gap-1">
          {(['expense', 'income'] as TransactionType[]).map((t) => (
            <button key={t} type="button"
              onClick={() => { setType(t); setCategoryId('') }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all',
                type === t
                  ? t === 'income' ? 'bg-surface text-income shadow-sm' : 'bg-surface text-expense shadow-sm'
                  : 'text-muted hover:text-text'
              )}
            >
              {t === 'income'
                ? <><TrendingUp size={14} strokeWidth={2.5} /> รายรับ</>
                : <><TrendingDown size={14} strokeWidth={2.5} /> รายจ่าย</>
              }
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className={fieldClass}>
          <label className="block text-xs font-medium text-muted mb-1.5">จำนวนเงิน (฿)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            required min="0.01" step="any" placeholder="0"
            className={cn(inputClass, 'text-3xl font-bold tracking-tight text-text placeholder:text-border')} />
        </div>

        {/* Date */}
        <div className={fieldClass}>
          <label htmlFor="date" className="block text-xs font-medium text-muted mb-1.5">วันที่</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className={cn(inputClass, 'text-sm font-medium text-text')} />
        </div>

        {/* Category grid */}
        <div className={fieldClass}>
          <label className="block text-xs font-medium text-muted mb-3">หมวดหมู่</label>
          <div className="grid grid-cols-3 gap-2">
            {categoryList.map((cat) => {
              const active = categoryId === cat.id
              return (
                <motion.button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-2 text-xs font-medium transition-all',
                    active ? 'shadow-sm' : 'border-transparent bg-bg text-muted hover:bg-gray-100'
                  )}
                  style={active ? { borderColor: cat.color, color: cat.color, backgroundColor: `${cat.color}10` } : {}}
                >
                  <span className="text-xl leading-none">{cat.icon}</span>
                  <span className="text-center leading-tight">{cat.name}</span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <div className={fieldClass}>
          <label htmlFor="description" className="block text-xs font-medium text-muted mb-1.5">คำอธิบาย</label>
          <input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            required placeholder="ระบุรายละเอียด"
            className={cn(inputClass, 'text-sm font-medium text-text placeholder:text-border')} />
        </div>

        {/* Note */}
        <div className={fieldClass}>
          <label htmlFor="note" className="block text-xs font-medium text-muted mb-1.5">
            หมายเหตุ <span className="font-normal text-muted/70">(ไม่บังคับ)</span>
          </label>
          <input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="เพิ่มหมายเหตุ..."
            className={cn(inputClass, 'text-sm text-text placeholder:text-border')} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <motion.button type="submit" disabled={saving || !isValid} whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-primary/10"
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> กำลังบันทึก...</>
              : initial ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'
            }
          </motion.button>
          {initial && (
            <motion.button type="button" onClick={() => setShowDelete(true)} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-muted hover:border-rose-200 hover:text-expense hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={14} />
            </motion.button>
          )}
        </div>
      </form>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-sm rounded-2xl bg-surface border border-border p-6 shadow-xl"
            >
              <h3 className="text-base font-semibold text-text mb-1">ลบรายการนี้?</h3>
              <p className="text-sm text-muted mb-5">ไม่สามารถย้อนกลับได้</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDelete(false)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-text hover:bg-bg transition-colors">
                  ยกเลิก
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50 transition-colors">
                  {deleting ? <><Loader2 size={13} className="animate-spin" /> ลบ...</> : 'ลบรายการ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
