import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

export async function readJson<T>(relativePath: string): Promise<T | null> {
  const filePath = path.join(DATA_DIR, relativePath)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function writeJson<T>(relativePath: string, data: T): Promise<void> {
  const filePath = path.join(DATA_DIR, relativePath)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}
