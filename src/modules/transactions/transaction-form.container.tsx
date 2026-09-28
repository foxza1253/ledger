'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, ChevronLeft, Loader2, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { useLedger } from '@/common/contexts/LedgerContext'
import { useHydrated } from '@/common/hooks/use-hydrated'
import { ApiClientError, errorMessage } from '@/lib/api-client'
import { todayString, toDateString } from '@/lib/date'
import { cn } from '@/lib/cn'
import { createTransaction, updateTransaction, deleteTransaction } from './transaction.service'
import type { Transaction, TransactionType } from '@/common/type/interface'

interface TransactionFormProps { initial?: Transaction }

function yesterdayString() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toDateString(d)
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-danger">{message}</p>
}

export default function TransactionFormContainer(props: TransactionFormProps) {
  // Default date is "today" — only compute it on the client (see useHydrated).
  const hydrated = useHydrated()
  if (!hydrated) {
    return (
      <div className="card mx-auto max-w-xl space-y-5 p-6" aria-busy="true">
        <div className="skeleton h-12 w-full rounded-2xl" />
        <div className="skeleton h-20 w-full rounded-2xl" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    )
  }
  return <TransactionForm {...props} />
}

function TransactionForm({ initial }: TransactionFormProps) {
  const router = useRouter()
  const { categories, symbol, setYearMonth } = useLedger()

  const [type, setType]               = useState<TransactionType>(initial?.type ?? 'expense')
  const [date, setDate]               = useState(initial?.date ?? todayString())
  const [categoryId, setCategoryId]   = useState(initial?.categoryId ?? '')
  const [amount, setAmount]           = useState(initial?.amount?.toString() ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [note, setNote]               = useState(initial?.note ?? '')
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const [saving, setSaving]           = useState(false)
  const [showDelete, setShowDelete]   = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  const categoryList = categories ? categories[type] : []
  const amountNum = Number(amount)
  const isValid = !!categoryId && Number.isFinite(amountNum) && amountNum > 0 && description.trim().length > 0 && !!date

  useEffect(() => {
    if (!showDelete) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowDelete(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showDelete])

  function goToListFor(dateStr: string) {
    const [y, m] = dateStr.split('-').map(Number)
    setYearMonth(y, m)
    router.push('/transactions')
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clientErrors: Record<string, string> = {}
    if (!(amountNum > 0)) clientErrors.amount = 'กรุณากรอกจำนวนเงินมากกว่า 0'
    if (!categoryId) clientErrors.categoryId = 'กรุณาเลือกหมวดหมู่'
    if (!description.trim()) clientErrors.description = 'กรุณากรอกคำอธิบาย'
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    setSaving(true)
    try {
      const payload = { date, type, categoryId, amount: amountNum, description: description.trim(), note: note.trim() }
      if (initial) {
        await updateTransaction(initial.id, initial.date, payload)
        toast.success('แก้ไขรายการสำเร็จ')
      } else {
        await createTransaction(payload)
        toast.success('บันทึกรายการสำเร็จ')
      }
      goToListFor(date)
    } catch (err) {
      if (err instanceof ApiClientError && err.details) setErrors(err.details)
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!initial) return
    setDeleting(true)
    try {
      await deleteTransaction(initial.id, initial.date)
      toast.success('ลบรายการสำเร็จ')
      goToListFor(initial.date)
    } catch (err) {
      toast.error(errorMessage(err, 'ลบไม่สำเร็จ กรุณาลองใหม่'))
      setDeleting(false)
    }
  }

  const label = 'mb-2 block text-sm font-semibold text-text'
  const accent = type === 'income' ? 'text-income' : 'text-expense'

  return (
    <div className="mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
      <Link href="/transactions" className="mb-4 inline-flex items-center gap-1 rounded-lg px-1 text-sm font-medium text-muted hover:text-primary-strong">
        <ChevronLeft size={16} /> กลับไปหน้าธุรกรรม
      </Link>

      <form onSubmit={handleSubmit} noValidate className="card space-y-6 p-5 sm:p-6">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-bg p-1.5 ring-1 ring-inset ring-border" role="radiogroup" aria-label="ประเภทรายการ">
          {(['expense', 'income'] as TransactionType[]).map((t) => {
            const active = type === t
            return (
              <button key={t} type="button" role="radio" aria-checked={active}
                onClick={() => { if (t !== type) { setType(t); setCategoryId('') } }}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-2.5 text-[15px] font-semibold transition-all',
                  active
                    ? t === 'income' ? 'bg-income text-white shadow-sm' : 'bg-expense text-white shadow-sm'
                    : 'text-muted hover:bg-surface hover:text-text',
                )}
              >
                {t === 'income' ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2.5} />}
                {t === 'income' ? 'รายรับ' : 'รายจ่าย'}
              </button>
            )
          })}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className={label}>จำนวนเงิน</label>
          <div className={cn(
            'flex items-baseline gap-2 rounded-2xl border-2 bg-surface px-4 py-3 transition-colors focus-within:border-primary',
            errors.amount ? 'border-danger' : 'border-border-strong',
          )}>
            <span className={cn('text-2xl font-bold', accent)}>{symbol}</span>
            <input id="amount" type="number" inputMode="decimal" value={amount}
              onChange={(e) => setAmount(e.target.value)} min="0.01" step="0.01" placeholder="0.00" autoFocus={!initial}
              aria-invalid={!!errors.amount} aria-describedby="amount-error"
              className={cn('w-full bg-transparent text-4xl font-bold tracking-tight tabular-nums placeholder:text-border-strong focus:outline-none', accent)} />
          </div>
          <FieldError id="amount-error" message={errors.amount} />
        </div>

        {/* Category grid */}
        <fieldset>
          <legend className={label}>หมวดหมู่</legend>
          {categoryList.length === 0 ? (
            <p className="rounded-xl bg-bg px-4 py-3 text-sm text-muted">
              ยังไม่มีหมวดหมู่ — <Link href="/categories" className="font-semibold text-primary-strong underline">เพิ่มหมวดหมู่</Link>
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {categoryList.map((cat) => {
                const active = categoryId === cat.id
                return (
                  <motion.button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)} whileTap={{ scale: 0.95 }}
                    aria-pressed={active}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border-2 px-1.5 py-3 text-sm font-medium transition-all',
                      active ? 'border-primary bg-primary-soft text-primary-strong shadow-sm' : 'border-transparent bg-bg text-text hover:border-border-strong',
                    )}
                  >
                    <span className="text-2xl leading-none" aria-hidden>{cat.icon}</span>
                    <span className="line-clamp-2 text-center leading-tight">{cat.name}</span>
                  </motion.button>
                )
              })}
            </div>
          )}
          <FieldError id="category-error" message={errors.categoryId} />
        </fieldset>

        {/* Date */}
        <div>
          <label htmlFor="date" className={label}>วันที่</label>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-44 flex-1">
              <CalendarDays size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" />
              <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                aria-invalid={!!errors.date} className="field-input pl-9" />
            </div>
            {[{ v: todayString(), l: 'วันนี้' }, { v: yesterdayString(), l: 'เมื่อวาน' }].map(({ v, l }) => (
              <button key={l} type="button" onClick={() => setDate(v)}
                className={cn('rounded-xl px-3.5 text-sm font-semibold ring-1 ring-inset transition-colors',
                  date === v ? 'bg-primary-soft text-primary-strong ring-primary-muted' : 'text-muted ring-border-strong hover:bg-bg')}>
                {l}
              </button>
            ))}
          </div>
          <FieldError id="date-error" message={errors.date} />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={label}>คำอธิบาย</label>
          <input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            maxLength={200} placeholder="เช่น ข้าวกลางวัน, ค่าไฟเดือนนี้"
            aria-invalid={!!errors.description} aria-describedby="description-error"
            className={cn('field-input', errors.description && 'border-danger')} />
          <FieldError id="description-error" message={errors.description} />
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className={label}>
            หมายเหตุ <span className="font-normal text-subtle">(ไม่บังคับ)</span>
          </label>
          <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500}
            placeholder="รายละเอียดเพิ่มเติม..." className="field-input resize-none" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-border pt-5">
          <button type="submit" disabled={saving} className={cn('btn-primary flex-1 py-3 text-[15px]', !isValid && 'opacity-70')}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</> : initial ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
          </button>
          {initial && (
            <button type="button" onClick={() => setShowDelete(true)} aria-label="ลบรายการ"
              className="flex items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-danger ring-1 ring-inset ring-danger/25 transition-colors hover:bg-danger-soft">
              <Trash2 size={16} /> <span className="hidden sm:inline">ลบ</span>
            </button>
          )}
        </div>
      </form>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-text/30 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setShowDelete(false)}
          >
            <motion.div
              role="alertdialog" aria-modal="true" aria-labelledby="del-title" aria-describedby="del-desc"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-sm p-6"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
                <Trash2 size={22} />
              </span>
              <h3 id="del-title" className="mb-1 text-lg font-bold text-text">ลบรายการนี้?</h3>
              <p id="del-desc" className="mb-6 text-sm text-muted">
                “{initial?.description}” จะถูกลบถาวรและไม่สามารถกู้คืนได้
              </p>
              <div className="flex gap-3">
                <button ref={cancelRef} onClick={() => setShowDelete(false)} className="btn-secondary flex-1">ยกเลิก</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50">
                  {deleting ? <><Loader2 size={14} className="animate-spin" /> กำลังลบ...</> : 'ลบรายการ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
