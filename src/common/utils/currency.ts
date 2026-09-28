export function formatCurrency(amount: number, symbol = '฿', locale = 'th-TH', maxFractionDigits = 2): string {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(amount)
  return `${symbol}${formatted}`
}

/** Compact axis label: 12,500 → 12.5K */
export function formatCompact(amount: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(amount)
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
}
