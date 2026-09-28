'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Plus, UserRound } from 'lucide-react'
import { useLedger } from '@/common/contexts/LedgerContext'
import { cn } from '@/lib/cn'
import Logo from './logo'
import { mainNav, settingsNav, isActive, type NavItem } from './nav-items'

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, Icon } = item
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors',
        active ? 'text-primary-strong' : 'text-muted hover:bg-primary-soft/60 hover:text-text',
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-primary-soft ring-1 ring-primary-muted"
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        />
      )}
      <Icon size={18} strokeWidth={active ? 2.4 : 2} className="relative" />
      <span className="relative">{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { account, logout } = useLedger()

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-surface/85 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <div className="px-4 pb-2">
        <Link href="/transactions/new" className="btn-primary w-full py-3">
          <Plus size={16} strokeWidth={2.5} /> บันทึกรายการ
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3" aria-label="เมนูหลัก">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-subtle">เมนู</p>
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-3">
        <NavLink item={settingsNav} active={isActive(pathname, settingsNav.href)} />
        {account && account.mode !== 'disabled' && (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-bg px-3 py-2.5 ring-1 ring-inset ring-border">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
              <UserRound size={16} />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-text" title={account.email ?? undefined}>
              {account.email ?? 'เจ้าของบัญชี'}
            </span>
            <button type="button" onClick={logout} aria-label="ออกจากระบบ" title="ออกจากระบบ"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
