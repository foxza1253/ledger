import { api } from '@/lib/api-client'
import type { MonthlySummary, TrendPoint } from '@/common/type/interface'

export async function fetchMonthlySummary(year: number, month: number, signal?: AbortSignal): Promise<MonthlySummary> {
  return (await api<{ summary: MonthlySummary }>(`/monthly?year=${year}&month=${month}`, { signal })).summary
}

export async function fetchTrend(year: number, month: number, months = 6, signal?: AbortSignal): Promise<TrendPoint[]> {
  return (await api<{ trend: TrendPoint[] }>(`/trend?year=${year}&month=${month}&months=${months}`, { signal })).trend
}
