import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const DATA_DIR = process.env.LEDGER_DATA_DIR
  ? path.resolve(process.env.LEDGER_DATA_DIR)
  : path.join(process.cwd(), 'data')

const locks = new Map<string, Promise<unknown>>()

function resolve(relativePath: string): string {
  const full = path.resolve(DATA_DIR, relativePath)
  if (!full.startsWith(DATA_DIR + path.sep)) throw new Error(`Path escapes data dir: ${relativePath}`)
  return full
}

/** Serializes read-modify-write cycles per file within this process. */
export async function withLock<T>(relativePath: string, fn: () => Promise<T>): Promise<T> {
  const key = resolve(relativePath)
  const prev = locks.get(key) ?? Promise.resolve()
  const run = prev.catch(() => {}).then(fn)
  locks.set(key, run)
  try {
    return await run
  } finally {
    if (locks.get(key) === run) locks.delete(key)
  }
}

export async function readJson<T>(relativePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(resolve(relativePath), 'utf-8')
    return JSON.parse(raw) as T
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}

/** Atomic write: temp file + rename, so a crash never leaves a half-written file. */
export async function writeJson<T>(relativePath: string, data: T): Promise<void> {
  const filePath = resolve(relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const tmp = `${filePath}.${randomUUID()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  await fs.rename(tmp, filePath)
}

export async function listJsonFiles(relativeDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(resolve(relativeDir))
    return entries.filter((f) => f.endsWith('.json')).sort()
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
}
