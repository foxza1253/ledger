import type { MonthlySummary } from '@/common/type/interface'

export async function fetchMonthlySummary(year: number, month: number): Promise<MonthlySummary | null> {
  const res = await fetch(`/api/ledger/monthly?year=${year}&month=${month}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.summary ?? null
}
