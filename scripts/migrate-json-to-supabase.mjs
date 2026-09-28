// Imports data/*.json into Supabase for ONE user (admin CLI — uses the service-role key,
// which the running app never uses). Replaces that user's categories + transactions.
//
// Usage:
//   npm run db:migrate-json -- --user <auth-user-uuid> --yes
// Env (.env.local): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)
// Run `npm run data:migrate-ids` first if data/ still has legacy (non-UUID) ids.
import fs from 'node:fs/promises'
import path from 'node:path'

const args = process.argv.slice(2)
const userId = args[args.indexOf('--user') + 1]
const confirmed = args.includes('--yes')
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
const dataDir = path.resolve(process.env.LEDGER_DATA_DIR ?? 'data')

function fail(msg) { console.error(`✗ ${msg}`); process.exit(1) }
if (!url || !key) fail('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
if (!args.includes('--user') || !UUID.test(userId ?? '')) fail('Pass --user <uuid> (Supabase → Authentication → Users → copy UID)')

const headers = { apikey: key, 'Content-Type': 'application/json' }
if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`

async function call(method, p, body, prefer) {
  const res = await fetch(`${url}${p}`, {
    method, headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) fail(`${method} ${p}: ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

const readJson = async (p) => JSON.parse(await fs.readFile(path.join(dataDir, p), 'utf-8'))

// ── Load + check local data ──
const categories = await readJson('categories.json')
const catRows = ['income', 'expense'].flatMap((type) =>
  categories[type].map((c, i) => ({ id: c.id, user_id: userId, type, name: c.name, icon: c.icon, color: c.color, sort_order: i })))
const settings = await readJson('settings.json')
const files = (await fs.readdir(path.join(dataDir, 'transactions')).catch(() => [])).filter((f) => f.endsWith('.json'))
const txnRows = []
for (const f of files) {
  for (const t of (await readJson(`transactions/${f}`)).transactions ?? []) {
    txnRows.push({
      id: t.id, user_id: userId, date: t.date, type: t.type, category_id: t.categoryId,
      amount: Number(t.amount), description: t.description, note: t.note ?? '', tags: t.tags ?? [],
      created_at: t.createdAt, updated_at: t.updatedAt,
    })
  }
}
const legacy = [...catRows, ...txnRows].filter((r) => !UUID.test(r.id) || (r.category_id && !UUID.test(r.category_id)))
if (legacy.length) fail(`${legacy.length} legacy id(s) found — run \`npm run data:migrate-ids\` first`)

// ── Verify target user ──
const user = await call('GET', `/auth/v1/admin/users/${userId}`)
console.log(`target user: ${user.email ?? userId}`)
console.log(`will import ${catRows.length} categories, ${txnRows.length} transactions, settings`)
if (!confirmed) {
  console.log('\nThis REPLACES the user\'s existing categories and transactions. Re-run with --yes to proceed.')
  process.exit(0)
}

// ── Replace ──
await call('DELETE', `/rest/v1/transactions?user_id=eq.${userId}`)
await call('DELETE', `/rest/v1/categories?user_id=eq.${userId}`)
await call('POST', '/rest/v1/categories', catRows, 'return=minimal')
for (let i = 0; i < txnRows.length; i += 500) {
  await call('POST', '/rest/v1/transactions', txnRows.slice(i, i + 500), 'return=minimal')
}
await call('POST', '/rest/v1/settings?on_conflict=user_id', [{
  user_id: userId,
  currency: settings.currency,
  currency_symbol: settings.currencySymbol,
  locale: settings.locale,
  monthly_budget_enabled: settings.monthlyBudget.enabled,
  monthly_budget_amount: settings.monthlyBudget.amount,
  start_day_of_month: settings.startDayOfMonth ?? 1,
}], 'resolution=merge-duplicates,return=minimal')

console.log(`✓ imported ${catRows.length} categories, ${txnRows.length} transactions, settings`)
console.log('Set LEDGER_DB_PROVIDER=supabase in .env.local and restart.')
