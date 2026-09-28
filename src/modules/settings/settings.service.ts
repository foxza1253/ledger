import { api } from '@/lib/api-client'
import type { Settings } from '@/common/type/interface'

export async function fetchSettings(): Promise<Settings> {
  return (await api<{ settings: Settings }>('/settings')).settings
}

export async function saveSettings(data: Partial<Settings>): Promise<Settings> {
  return (await api<{ settings: Settings }>('/settings', { method: 'PUT', body: data })).settings
}
