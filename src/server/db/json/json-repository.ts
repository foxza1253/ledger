import { randomUUID } from 'crypto'
import { addMonths, getMonthKey } from '@/lib/date'
import { DEFAULT_SETTINGS } from '@/common/type/interface'
import type { Categories, Category, MonthlyFile, Settings, Transaction } from '@/common/type/interface'
import type { CategoryRepository, LedgerRepository, SettingsRepository, TransactionRepository } from '../types'
import { listJsonFiles, readJson, withLock, writeJson } from './file-store'

const CATEGORIES_FILE = 'categories.json'
const SETTINGS_FILE = 'settings.json'
const TXN_DIR = 'transactions'

const monthKeyOf = (date: string) => date.slice(0, 7)
const monthFile = (key: string) => `${TXN_DIR}/${key}.json`

const newestFirst = (a: Transaction, b: Transaction) =>
  b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)

async function readMonth(key: string): Promise<Transaction[]> {
  return (await readJson<MonthlyFile>(monthFile(key)))?.transactions ?? []
}

async function writeMonth(key: string, transactions: Transaction[]) {
  const [year, month] = key.split('-').map(Number)
  await writeJson<MonthlyFile>(monthFile(key), { year, month, transactions })
}

async function allMonthKeys(): Promise<string[]> {
  return (await listJsonFiles(TXN_DIR)).map((f) => f.replace(/\.json$/, ''))
}

const transactions: TransactionRepository = {
  async listByDateRange(from, to) {
    const keys: string[] = []
    let { year, month } = { year: Number(from.slice(0, 4)), month: Number(from.slice(5, 7)) }
    const endKey = monthKeyOf(to)
    for (let key = getMonthKey(year, month); key <= endKey; key = getMonthKey(year, month)) {
      keys.push(key)
      ;({ year, month } = addMonths(year, month, 1))
    }
    const months = await Promise.all(keys.map(readMonth))
    return months.flat().filter((t) => t.date >= from && t.date <= to).sort(newestFirst)
  },

  async findById(id, dateHint) {
    if (dateHint && /^\d{4}-\d{2}/.test(dateHint)) {
      const hit = (await readMonth(monthKeyOf(dateHint))).find((t) => t.id === id)
      if (hit) return hit
    }
    for (const key of await allMonthKeys()) {
      const hit = (await readMonth(key)).find((t) => t.id === id)
      if (hit) return hit
    }
    return null
  },

  async create(input) {
    const now = new Date().toISOString()
    const txn: Transaction = { note: '', tags: [], ...input, id: randomUUID(), createdAt: now, updatedAt: now }
    const key = monthKeyOf(txn.date)
    await withLock(monthFile(key), async () => {
      await writeMonth(key, [...(await readMonth(key)), txn])
    })
    return txn
  },

  async update(prev, patch) {
    const next: Transaction = { ...prev, ...patch, id: prev.id, createdAt: prev.createdAt, updatedAt: new Date().toISOString() }
    const fromKey = monthKeyOf(prev.date)
    const toKey = monthKeyOf(next.date)
    if (fromKey === toKey) {
      await withLock(monthFile(fromKey), async () => {
        await writeMonth(fromKey, (await readMonth(fromKey)).map((t) => (t.id === prev.id ? next : t)))
      })
      return next
    }
    // Date moved to another month: remove from old partition, append to new one.
    // Lock in a stable order to avoid deadlocks between concurrent moves.
    const [first, second] = [fromKey, toKey].sort()
    await withLock(monthFile(first), () =>
      withLock(monthFile(second), async () => {
        const [src, dst] = await Promise.all([readMonth(fromKey), readMonth(toKey)])
        await writeMonth(toKey, [...dst.filter((t) => t.id !== prev.id), next])
        await writeMonth(fromKey, src.filter((t) => t.id !== prev.id))
      }),
    )
    return next
  },

  async delete(txn) {
    const key = monthKeyOf(txn.date)
    await withLock(monthFile(key), async () => {
      await writeMonth(key, (await readMonth(key)).filter((t) => t.id !== txn.id))
    })
  },

  async countByCategory(categoryId) {
    let count = 0
    for (const key of await allMonthKeys()) {
      count += (await readMonth(key)).filter((t) => t.categoryId === categoryId).length
    }
    return count
  },
}

async function readCategories(): Promise<Categories> {
  return (await readJson<Categories>(CATEGORIES_FILE)) ?? { income: [], expense: [] }
}

const categories: CategoryRepository = {
  list: readCategories,

  async findById(id) {
    const all = await readCategories()
    for (const type of ['income', 'expense'] as const) {
      const hit = all[type].find((c) => c.id === id)
      if (hit) return { ...hit, type }
    }
    return null
  },

  async create({ type, ...fields }) {
    const cat: Category = { id: randomUUID(), ...fields }
    await withLock(CATEGORIES_FILE, async () => {
      const all = await readCategories()
      await writeJson(CATEGORIES_FILE, { ...all, [type]: [...all[type], cat] })
    })
    return cat
  },

  async update(id, patch) {
    return withLock(CATEGORIES_FILE, async () => {
      const all = await readCategories()
      const type = (['income', 'expense'] as const).find((t) => all[t].some((c) => c.id === id))
      if (!type) return null
      const updated: Category = { ...all[type].find((c) => c.id === id)!, ...patch, id }
      await writeJson(CATEGORIES_FILE, { ...all, [type]: all[type].map((c) => (c.id === id ? updated : c)) })
      return updated
    })
  },

  async delete(id) {
    return withLock(CATEGORIES_FILE, async () => {
      const all = await readCategories()
      const next = {
        income: all.income.filter((c) => c.id !== id),
        expense: all.expense.filter((c) => c.id !== id),
      }
      const removed = next.income.length + next.expense.length < all.income.length + all.expense.length
      if (removed) await writeJson(CATEGORIES_FILE, next)
      return removed
    })
  },
}

const settings: SettingsRepository = {
  async get() {
    const stored = await readJson<Partial<Settings>>(SETTINGS_FILE)
    return { ...DEFAULT_SETTINGS, ...stored, monthlyBudget: { ...DEFAULT_SETTINGS.monthlyBudget, ...stored?.monthlyBudget } }
  },
  async save(next) {
    await withLock(SETTINGS_FILE, () => writeJson(SETTINGS_FILE, next))
    return next
  },
}

export const jsonRepository: LedgerRepository = { transactions, categories, settings }
