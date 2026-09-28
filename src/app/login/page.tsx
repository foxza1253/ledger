import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthMode } from '@/server/auth/config'
import LoginForm from '@/modules/auth/login-form'

export const metadata: Metadata = { title: 'เข้าสู่ระบบ' }

/** Only allow same-site relative redirects after login (no open redirect). */
function safeNext(next: string | string[] | undefined): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : '/dashboard'
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams
  const mode = getAuthMode()
  if (mode === 'disabled') redirect(safeNext(next))
  // Only a boolean leaves the server — never the value.
  const configured = mode === 'supabase' || !!process.env.LEDGER_PASSWORD
  return <LoginForm mode={mode} next={safeNext(next)} configured={configured} />
}
