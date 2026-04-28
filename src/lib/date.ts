export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-')
  return { year: parseInt(y), month: parseInt(m) }
}

export function formatDate(dateStr: string, locale = 'th-TH'): string {
  return new Date(dateStr).toLocaleDateString(locale, {
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

export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function currentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
