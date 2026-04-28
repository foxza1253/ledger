export function formatCurrency(amount: number, symbol = '฿', locale = 'th-TH'): string {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${symbol}${formatted}`
}

export function formatNumber(amount: number, locale = 'th-TH'): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}
