'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import MonthPicker from '@/components/ui/MonthPicker'
import Logo from './logo'

const pageTitles: [RegExp, string, string?][] = [
  [/^\/dashboard$/,           'ภาพรวม',          'สรุปการเงินของเดือนที่เลือก'],
  [/^\/transactions\/new$/,   'บันทึกรายการใหม่'],
  [/^\/transactions\/[^/]+$/, 'แก้ไขรายการ'],
  [/^\/transactions$/,        'ธุรกรรม',          'รายการรับ-จ่ายทั้งหมดในเดือน'],
  [/^\/monthly$/,             'สรุปรายเดือน',     'รายวันและตามหมวดหมู่'],
  [/^\/categories$/,          'หมวดหมู่',         'จัดการหมวดหมู่รายรับ-รายจ่าย'],
  [/^\/reports$/,             'รายงาน',           'แนวโน้มและสัดส่วนการใช้จ่าย'],
  [/^\/settings$/,            'ตั้งค่า'],
]

const showMonthPickerOn = ['/dashboard', '/transactions', '/monthly', '/reports']

export default function Header() {
  const pathname = usePathname()
  const [, title, subtitle] = pageTitles.find(([re]) => re.test(pathname)) ?? [null, 'Ledger']
  const showPicker = showMonthPickerOn.includes(pathname)

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 lg:hidden">
        <Logo />
        <Link href="/settings" aria-label="ตั้งค่า" className="rounded-xl p-2 text-muted hover:bg-primary-soft hover:text-primary-strong">
          <Settings size={20} />
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:min-h-16">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-text">{title}</h1>
          {subtitle && <p className="hidden text-sm text-muted sm:block">{subtitle}</p>}
        </div>
        {showPicker && <MonthPicker />}
      </div>
    </header>
  )
}
