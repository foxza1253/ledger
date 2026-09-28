'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react'
import { authApi, errorMessage } from '@/lib/api-client'

export default function LoginForm({ mode, next, configured }: { mode: 'supabase' | 'password'; next: string; configured: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi('/login', { method: 'POST', body: { email, password } })
      // Full navigation so the new session cookie is used everywhere.
      window.location.assign(next)
    } catch (err) {
      setError(errorMessage(err, 'เข้าสู่ระบบไม่สำเร็จ'))
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500 to-primary-strong shadow-(--shadow-pop)">
            <WalletCards size={26} className="text-white" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-text">เข้าสู่ Ledger</h1>
          <p className="mt-1 text-sm text-muted">บันทึกรายรับ-รายจ่ายส่วนตัวของคุณ</p>
        </div>

        {!configured && (
          <div role="alert" className="mb-4 rounded-2xl bg-warning-soft p-4 text-sm text-warning ring-1 ring-inset ring-warning/25">
            <p className="mb-1 font-bold">ยังไม่ได้ตั้งรหัสผ่าน</p>
            <p className="text-text">
              สร้างไฟล์ <code className="font-semibold">.env.local</code> แล้วใส่{' '}
              <code className="font-semibold">LEDGER_PASSWORD</code> และ{' '}
              <code className="font-semibold">LEDGER_SESSION_SECRET</code> (ดู .env.example) จากนั้นรีสตาร์ทเซิร์ฟเวอร์
            </p>
          </div>
        )}

        <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
          {mode === 'supabase' && (
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-text">อีเมล</label>
              <input id="email" type="email" autoComplete="email" required value={email} autoFocus
                onChange={(e) => setEmail(e.target.value)} className="field-input" placeholder="you@example.com" />
            </div>
          )}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-text">รหัสผ่าน</label>
            <div className="relative">
              <LockKeyhole size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle" />
              <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} autoFocus={mode === 'password'}
                className="field-input px-9" />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-text">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>
          )}

          <button type="submit" disabled={loading || !password || (mode === 'supabase' && !email)} className="btn-primary w-full py-3">
            {loading ? <><Loader2 size={16} className="animate-spin" /> กำลังเข้าสู่ระบบ...</> : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck size={14} className="text-income" />
          {mode === 'supabase' ? 'ข้อมูลของแต่ละบัญชีถูกแยกด้วย Row Level Security' : 'โหมดผู้ใช้คนเดียว (ไฟล์ JSON)'}
        </p>
      </div>
    </main>
  )
}
