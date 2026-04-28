'use client'

import { usePathname } from 'next/navigation'
import MonthPicker from '@/components/ui/MonthPicker'

const pageTitles: Record<string, string> = {
  '/dashboard':        'ภาพรวม',
  '/transactions':     'ธุรกรรม',
  '/transactions/new': 'บันทึกรายการใหม่',
  '/monthly':          'สรุปรายเดือน',
  '/categories':       'หมวดหมู่',
  '/reports':          'รายงาน',
  '/settings':         'ตั้งค่า',
}

const showMonthPickerOn = ['/dashboard', '/transactions', '/monthly', '/reports']

export default function Header() {
  const pathname = usePathname()

  const title =
    Object.entries(pageTitles).find(
      ([key]) => pathname === key || pathname.startsWith(key + '/')
    )?.[1] ?? 'Ledger'

  const isEditPage = !!pathname.match(/^\/transactions\/[^/]+$/) && pathname !== '/transactions/new'
  const showPicker = showMonthPickerOn.some((p) => pathname === p) && !isEditPage

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-[15px] font-semibold text-text">{title}</h1>
      {showPicker && <MonthPicker />}
    </header>
  )
}
