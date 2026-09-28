import { LayoutDashboard, ArrowLeftRight, CalendarDays, Tag, BarChart3, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  Icon: LucideIcon
}

export const mainNav: NavItem[] = [
  { href: '/dashboard',    label: 'ภาพรวม',  Icon: LayoutDashboard },
  { href: '/transactions', label: 'ธุรกรรม',  Icon: ArrowLeftRight },
  { href: '/monthly',      label: 'รายเดือน', Icon: CalendarDays },
  { href: '/reports',      label: 'รายงาน',   Icon: BarChart3 },
  { href: '/categories',   label: 'หมวดหมู่', Icon: Tag },
]

export const settingsNav: NavItem = { href: '/settings', label: 'ตั้งค่า', Icon: Settings }

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}
