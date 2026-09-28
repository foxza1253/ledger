import type { Settings } from '@/common/type/interface'
import type { Session } from '../auth/session'
import { getRepository } from '../db'
import { validateSettingsPatch } from '../validation'

export function getSettings(session: Session): Promise<Settings> {
  return getRepository(session).settings.get()
}

export async function updateSettings(session: Session, body: unknown): Promise<Settings> {
  const patch = validateSettingsPatch(body)
  const repo = getRepository(session).settings
  const current = await repo.get()
  return repo.save({ ...current, ...patch })
}
