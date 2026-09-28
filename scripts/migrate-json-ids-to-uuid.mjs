// One-off: converts legacy ids (cat_001, txn_g35c21, ...) in data/*.json to UUIDs.
// Backs up the data dir first. Idempotent — ids that are already UUIDs are kept.
// Usage: npm run data:migrate-ids   (LEDGER_DATA_DIR overrides ./data)
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const dataDir = path.resolve(process.env.LEDGER_DATA_DIR ?? 'data')
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const readJson = async (p) => JSON.parse(await fs.readFile(path.join(dataDir, p), 'utf-8'))
async function writeJson(p, data) {
  const full = path.join(dataDir, p)
  const tmp = `${full}.${randomUUID()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  await fs.rename(tmp, full)
}

const backup = path.join(dataDir, `.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`)
// The backup lives inside dataDir, so copy entry by entry (fs.cp refuses to copy a dir into itself).
await fs.mkdir(backup)
for (const entry of await fs.readdir(dataDir)) {
  if (entry.startsWith('.backup-')) continue
  await fs.cp(path.join(dataDir, entry), path.join(backup, entry), { recursive: true })
}
console.log(`backup → ${path.relative(process.cwd(), backup)}`)

const idMap = new Map()
const categories = await readJson('categories.json')
let catChanged = 0
for (const type of ['income', 'expense']) {
  for (const c of categories[type] ?? []) {
    if (UUID.test(c.id)) continue
    const next = randomUUID()
    idMap.set(c.id, next)
    c.id = next
    catChanged++
  }
}
await writeJson('categories.json', categories)

let txnChanged = 0
const orphans = []
const files = (await fs.readdir(path.join(dataDir, 'transactions')).catch(() => [])).filter((f) => f.endsWith('.json'))
for (const f of files) {
  const file = await readJson(`transactions/${f}`)
  for (const t of file.transactions ?? []) {
    if (!UUID.test(t.id)) { t.id = randomUUID(); txnChanged++ }
    if (idMap.has(t.categoryId)) t.categoryId = idMap.get(t.categoryId)
    else if (!UUID.test(t.categoryId)) orphans.push(`${f}: ${t.description} (${t.categoryId})`)
  }
  await writeJson(`transactions/${f}`, file)
}

console.log(`categories: ${catChanged} ids converted`)
console.log(`transactions: ${txnChanged} ids converted across ${files.length} file(s)`)
if (orphans.length) {
  console.warn(`⚠ ${orphans.length} transaction(s) reference unknown categories:\n  ` + orphans.join('\n  '))
  process.exitCode = 1
}
