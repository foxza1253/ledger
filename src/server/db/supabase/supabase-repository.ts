import { DEFAULT_SETTINGS } from '@/common/type/interface'
import type { Categories, Category, CategoryType, Settings, Transaction, TransactionType } from '@/common/type/interface'
import { supabaseConfig } from '../../auth/config'
import { ApiError, conflict } from '../../errors'
import type { LedgerRepository } from '../types'

/**
 * Supabase provider over PostgREST (`/rest/v1`) using plain fetch — no SDK needed.
 * Schema: db/schema.sql. Every request carries the signed-in user's JWT, so Postgres
 * RLS restricts it to that user's rows; the service-role key is never used here.
 * user_id / id / timestamps are filled in by column defaults and triggers.
 */

interface TransactionRow {
  id: string
  date: string
  type: TransactionType
  category_id: string
  amount: number | string
  description: string
  note: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

interface CategoryRow {
  id: string
  type: CategoryType
  name: string
  icon: string
  color: string
}

interface SettingsRow {
  currency: string
  currency_symbol: string
  locale: string
  monthly_budget_enabled: boolean
  monthly_budget_amount: number | string
  start_day_of_month: number
}

const TXN_COLUMNS = 'id,date,type,category_id,amount,description,note,tags,created_at,updated_at'
const CAT_COLUMNS = 'id,type,name,icon,color'
const enc = encodeURIComponent

const toTransaction = (r: TransactionRow): Transaction => ({
  id: r.id,
  date: r.date,
  type: r.type,
  categoryId: r.category_id,
  amount: Number(r.amount),
  description: r.description,
  note: r.note ?? '',
  tags: r.tags ?? [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

const toCategory = (r: CategoryRow): Category => ({ id: r.id, name: r.name, icon: r.icon, color: r.color })

/** Maps camelCase input to columns, dropping undefined so PATCH only touches given fields. */
function transactionColumns(t: Partial<Transaction>): Record<string, unknown> {
  const out: Record<string, unknown> = {
    date: t.date, type: t.type, category_id: t.categoryId, amount: t.amount,
    description: t.description, note: t.note, tags: t.tags,
  }
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k]
  return out
}

export function createSupabaseRepository(accessToken: string): LedgerRepository {
  const { url, apiKey } = supabaseConfig()

  async function rest<T>(
    path: string,
    init: { method?: string; body?: unknown; prefer?: string[] } = {},
  ): Promise<{ data: T; headers: Headers }> {
    const headers: Record<string, string> = {
      apikey: apiKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
    if (init.prefer?.length) headers.Prefer = init.prefer.join(',')

    const res = await fetch(`${url}/rest/v1/${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
    })

    const text = await res.text()
    const json = text ? JSON.parse(text) : null
    if (!res.ok) {
      const code = (json as { code?: string } | null)?.code
      if (res.status === 401 || code === 'PGRST301' || code === 'PGRST303') throw new ApiError(401, 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
      if (code === '42501') throw new ApiError(403, 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้')
      if (code === '23503') throw conflict('ข้อมูลนี้ยังถูกใช้งานอยู่ หรืออ้างอิงข้อมูลที่ไม่มีสิทธิ์')
      if (code === '23505') throw conflict('ข้อมูลซ้ำ')
      if (code === '23514' || code === '22P02') throw new ApiError(400, 'ข้อมูลไม่ผ่านเงื่อนไขของฐานข้อมูล')
      console.error('[supabase]', res.status, text)
      throw new ApiError(502, 'ฐานข้อมูลตอบกลับผิดพลาด')
    }
    return { data: json as T, headers: res.headers }
  }

  return {
    transactions: {
      async listByDateRange(from, to) {
        const { data } = await rest<TransactionRow[]>(
          `transactions?select=${TXN_COLUMNS}&date=gte.${enc(from)}&date=lte.${enc(to)}&order=date.desc,created_at.desc`,
        )
        return data.map(toTransaction)
      },

      async findById(id) {
        const { data } = await rest<TransactionRow[]>(`transactions?select=${TXN_COLUMNS}&id=eq.${enc(id)}&limit=1`)
        return data[0] ? toTransaction(data[0]) : null
      },

      async create(input) {
        const { data } = await rest<TransactionRow[]>(`transactions?select=${TXN_COLUMNS}`, {
          method: 'POST', body: transactionColumns(input), prefer: ['return=representation'],
        })
        return toTransaction(data[0])
      },

      async update(prev, patch) {
        const { data } = await rest<TransactionRow[]>(`transactions?select=${TXN_COLUMNS}&id=eq.${enc(prev.id)}`, {
          method: 'PATCH', body: transactionColumns(patch), prefer: ['return=representation'],
        })
        if (!data[0]) throw new ApiError(404, 'ไม่พบรายการนี้')
        return toTransaction(data[0])
      },

      async delete(txn) {
        await rest(`transactions?id=eq.${enc(txn.id)}`, { method: 'DELETE' })
      },

      async countByCategory(categoryId) {
        const { headers } = await rest<unknown[]>(`transactions?select=id&category_id=eq.${enc(categoryId)}&limit=1`, {
          prefer: ['count=exact'],
        })
        // Content-Range: "0-0/42" or "*/0"
        return Number(headers.get('content-range')?.split('/')[1] ?? 0)
      },
    },

    categories: {
      async list() {
        const { data } = await rest<CategoryRow[]>(`categories?select=${CAT_COLUMNS}&order=sort_order.asc,created_at.asc`)
        const out: Categories = { income: [], expense: [] }
        for (const r of data) out[r.type].push(toCategory(r))
        return out
      },

      async findById(id) {
        const { data } = await rest<CategoryRow[]>(`categories?select=${CAT_COLUMNS}&id=eq.${enc(id)}&limit=1`)
        return data[0] ? { ...toCategory(data[0]), type: data[0].type } : null
      },

      async create({ type, name, icon, color }) {
        const { data } = await rest<CategoryRow[]>(`categories?select=${CAT_COLUMNS}`, {
          method: 'POST', body: { type, name, icon, color, sort_order: 1000 }, prefer: ['return=representation'],
        })
        return toCategory(data[0])
      },

      async update(id, patch) {
        const { data } = await rest<CategoryRow[]>(`categories?select=${CAT_COLUMNS}&id=eq.${enc(id)}`, {
          method: 'PATCH', body: patch, prefer: ['return=representation'],
        })
        return data[0] ? toCategory(data[0]) : null
      },

      async delete(id) {
        const { data } = await rest<CategoryRow[]>(`categories?select=id&id=eq.${enc(id)}`, {
          method: 'DELETE', prefer: ['return=representation'],
        })
        return data.length > 0
      },
    },

    settings: {
      async get() {
        const { data } = await rest<SettingsRow[]>(
          'settings?select=currency,currency_symbol,locale,monthly_budget_enabled,monthly_budget_amount,start_day_of_month&limit=1',
        )
        const r = data[0]
        if (!r) return DEFAULT_SETTINGS
        return {
          currency: r.currency,
          currencySymbol: r.currency_symbol,
          locale: r.locale,
          monthlyBudget: { enabled: r.monthly_budget_enabled, amount: Number(r.monthly_budget_amount) },
          startDayOfMonth: r.start_day_of_month,
        }
      },

      async save(s: Settings) {
        const row: SettingsRow = {
          currency: s.currency,
          currency_symbol: s.currencySymbol,
          locale: s.locale,
          monthly_budget_enabled: s.monthlyBudget.enabled,
          monthly_budget_amount: s.monthlyBudget.amount,
          start_day_of_month: s.startDayOfMonth,
        }
        // user_id comes from the column default auth.uid(); upsert on it.
        await rest('settings?on_conflict=user_id', {
          method: 'POST', body: row, prefer: ['resolution=merge-duplicates', 'return=minimal'],
        })
        return s
      },
    },
  }
}
