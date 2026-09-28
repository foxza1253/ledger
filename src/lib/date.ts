const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-')
  return { year: parseInt(y), month: parseInt(m) }
}

/** Formats a Date as YYYY-MM-DD in the local timezone (toISOString would use UTC). */
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Parses YYYY-MM-DD as a local date (new Date('YYYY-MM-DD') parses as UTC). */
export function parseDateOnly(dateStr: string): Date {
  const m = DATE_RE.exec(dateStr)
  if (!m) return new Date(dateStr)
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

export function isValidDateString(dateStr: string): boolean {
  const m = DATE_RE.exec(dateStr)
  if (!m) return false
  const d = parseDateOnly(dateStr)
  return d.getFullYear() === Number(m[1]) && d.getMonth() + 1 === Number(m[2]) && d.getDate() === Number(m[3])
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Inclusive first/last day of a month as YYYY-MM-DD. */
export function monthRange(year: number, month: number): { from: string; to: string } {
  const key = getMonthKey(year, month)
  return { from: `${key}-01`, to: `${key}-${String(daysInMonth(year, month)).padStart(2, '0')}` }
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function formatDate(dateStr: string, locale = 'th-TH'): string {
  return parseDateOnly(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatMonthYear(year: number, month: number, locale = 'th-TH'): string {
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
  })
}

export function formatMonthShort(year: number, month: number, locale = 'th-TH'): string {
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'short' })
}

export function todayString(): string {
  return toDateString(new Date())
}

export function currentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
