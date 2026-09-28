import { isValidDateString } from '@/lib/date'
import { badRequest } from './errors'
import type {
  CategoryType, CreateCategoryInput, CreateTransactionInput, Settings, TransactionType, UpdateCategoryInput,
} from '@/common/type/interface'

const MAX_AMOUNT = 1_000_000_000_000
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

type Obj = Record<string, unknown>

function asObject(body: unknown): Obj {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badRequest('ข้อมูลต้องเป็น object')
  return body as Obj
}

function str(v: unknown, field: string, errors: Record<string, string>, opts: { max: number; required?: boolean }) {
  if (v === undefined || v === null || v === '') {
    if (opts.required) errors[field] = 'จำเป็นต้องกรอก'
    return undefined
  }
  if (typeof v !== 'string') { errors[field] = 'ต้องเป็นข้อความ'; return undefined }
  const t = v.trim()
  if (opts.required && !t) { errors[field] = 'จำเป็นต้องกรอก'; return undefined }
  if (t.length > opts.max) { errors[field] = `ยาวได้ไม่เกิน ${opts.max} ตัวอักษร`; return undefined }
  return t
}

function throwIfErrors(errors: Record<string, string>) {
  if (Object.keys(errors).length > 0) throw badRequest('ข้อมูลไม่ถูกต้อง', errors)
}

export function isTransactionType(v: unknown): v is TransactionType {
  return v === 'income' || v === 'expense'
}

export function parseYearMonth(params: URLSearchParams): { year: number; month: number } {
  const year = Number(params.get('year'))
  const month = Number(params.get('month'))
  if (!Number.isInteger(year) || year < 1970 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw badRequest('ต้องระบุ year และ month ให้ถูกต้อง')
  }
  return { year, month }
}

function validateTransactionFields(b: Obj, partial: boolean) {
  const errors: Record<string, string> = {}
  const out: Partial<CreateTransactionInput> = {}
  const required = !partial

  if (b.date !== undefined || required) {
    if (typeof b.date !== 'string' || !isValidDateString(b.date)) errors.date = 'วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD'
    else out.date = b.date
  }
  if (b.type !== undefined || required) {
    if (!isTransactionType(b.type)) errors.type = 'ประเภทต้องเป็น income หรือ expense'
    else out.type = b.type
  }
  if (b.categoryId !== undefined || required) {
    if (!isUuid(b.categoryId)) errors.categoryId = 'กรุณาเลือกหมวดหมู่'
    else out.categoryId = b.categoryId.toLowerCase()
  }
  if (b.amount !== undefined || required) {
    const n = typeof b.amount === 'string' ? Number(b.amount) : b.amount
    if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) errors.amount = 'จำนวนเงินต้องมากกว่า 0'
    else if (n > MAX_AMOUNT) errors.amount = 'จำนวนเงินมากเกินไป'
    else out.amount = Math.round(n * 100) / 100
  }
  if (b.description !== undefined || required) {
    out.description = str(b.description, 'description', errors, { max: 200, required: true })
  }
  if (b.note !== undefined) out.note = str(b.note, 'note', errors, { max: 500 }) ?? ''
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags) || b.tags.some((t) => typeof t !== 'string' || t.length > 40) || b.tags.length > 20) {
      errors.tags = 'tags ต้องเป็นรายการข้อความ (ไม่เกิน 20 รายการ)'
    } else {
      out.tags = [...new Set((b.tags as string[]).map((t) => t.trim()).filter(Boolean))]
    }
  }

  throwIfErrors(errors)
  return out
}

export function validateCreateTransaction(body: unknown): CreateTransactionInput {
  const out = validateTransactionFields(asObject(body), false)
  return { note: '', tags: [], ...out } as CreateTransactionInput
}

export function validateUpdateTransaction(body: unknown): Partial<CreateTransactionInput> {
  return validateTransactionFields(asObject(body), true)
}

function validateCategoryFields(b: Obj, partial: boolean) {
  const errors: Record<string, string> = {}
  const out: UpdateCategoryInput = {}
  const required = !partial
  if (b.name !== undefined || required) out.name = str(b.name, 'name', errors, { max: 40, required: true })
  if (b.icon !== undefined || required) out.icon = str(b.icon, 'icon', errors, { max: 16, required: true })
  if (b.color !== undefined || required) {
    if (typeof b.color !== 'string' || !HEX_COLOR.test(b.color)) errors.color = 'สีต้องเป็นรูปแบบ #RRGGBB'
    else out.color = b.color
  }
  return { out, errors }
}

export function validateCreateCategory(body: unknown): CreateCategoryInput {
  const b = asObject(body)
  const { out, errors } = validateCategoryFields(b, false)
  if (!isTransactionType(b.type)) errors.type = 'ประเภทต้องเป็น income หรือ expense'
  throwIfErrors(errors)
  return { ...(out as Required<UpdateCategoryInput>), type: b.type as CategoryType }
}

export function validateUpdateCategory(body: unknown): UpdateCategoryInput {
  const { out, errors } = validateCategoryFields(asObject(body), true)
  throwIfErrors(errors)
  return out
}

export function validateSettingsPatch(body: unknown): Partial<Settings> {
  const b = asObject(body)
  const errors: Record<string, string> = {}
  const out: Partial<Settings> = {}

  if (b.currency !== undefined) {
    if (typeof b.currency !== 'string' || !/^[A-Z]{3}$/.test(b.currency)) errors.currency = 'รหัสสกุลเงินต้องเป็นตัวอักษร 3 ตัว'
    else out.currency = b.currency
  }
  if (b.currencySymbol !== undefined) {
    const s = str(b.currencySymbol, 'currencySymbol', errors, { max: 4, required: true })
    if (s) out.currencySymbol = s
  }
  if (b.locale !== undefined) {
    const s = str(b.locale, 'locale', errors, { max: 16, required: true })
    if (s) out.locale = s
  }
  if (b.monthlyBudget !== undefined) {
    const mb = b.monthlyBudget as Obj | null
    const amount = Number(mb?.amount)
    if (!mb || typeof mb.enabled !== 'boolean' || !Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) {
      errors.monthlyBudget = 'งบประมาณไม่ถูกต้อง'
    } else {
      out.monthlyBudget = { enabled: mb.enabled, amount: Math.round(amount * 100) / 100 }
    }
  }
  if (b.startDayOfMonth !== undefined) {
    const d = Number(b.startDayOfMonth)
    if (!Number.isInteger(d) || d < 1 || d > 28) errors.startDayOfMonth = 'ต้องเป็นวันที่ 1–28'
    else out.startDayOfMonth = d
  }

  throwIfErrors(errors)
  return out
}
