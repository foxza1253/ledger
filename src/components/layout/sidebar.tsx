'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, ArrowLeftRight, CalendarDays,
  Tag, BarChart2, Settings, DollarSign,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',    label: 'ภาพรวม',  Icon: LayoutDashboard },
  { href: '/transactions', label: 'ธุรกรรม',  Icon: ArrowLeftRight },
  { href: '/monthly',      label: 'รายเดือน', Icon: CalendarDays },
  { href: '/categories',   label: 'หมวดหมู่', Icon: Tag },
  { href: '/reports',      label: 'รายงาน',   Icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-55 bg-surface border-r border-border flex flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20">
          <DollarSign size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-bold text-text tracking-tight">Ledger</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, Icon }, i) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <motion.div key={href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.2 }}>
              <Link
                href={href}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active ? 'bg-primary/8 text-primary' : 'text-muted hover:bg-bg hover:text-text'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-border pt-3">
        {(() => {
          const active = pathname === '/settings'
          return (
            <Link
              href="/settings"
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active ? 'bg-primary/8 text-primary' : 'text-muted hover:bg-bg hover:text-text'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <Settings size={17} strokeWidth={active ? 2.5 : 2} />
              ตั้งค่า
            </Link>
          )
        })()}
      </div>
    </aside>
  )
}
