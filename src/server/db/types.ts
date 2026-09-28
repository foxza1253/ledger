import type {
  Categories, Category, CategoryType, CreateCategoryInput, CreateTransactionInput, Settings, Transaction,
  UpdateCategoryInput, UpdateTransactionInput,
} from '@/common/type/interface'

/**
 * Storage contract. Services depend only on these interfaces, so switching from
 * JSON files to Postgres (Supabase / Neon / ...) means adding a provider here —
 * routes, services and UI stay untouched.
 */
export interface TransactionRepository {
  /** Inclusive range on `date` (YYYY-MM-DD), newest first. */
  listByDateRange(from: string, to: string): Promise<Transaction[]>
  /** `dateHint` lets partitioned stores (JSON months) skip a full scan. */
  findById(id: string, dateHint?: string): Promise<Transaction | null>
  /** The store assigns id (UUID) and timestamps. */
  create(input: CreateTransactionInput): Promise<Transaction>
  /** `prev` is the stored row; `patch.date` may move it to another month. */
  update(prev: Transaction, patch: UpdateTransactionInput): Promise<Transaction>
  delete(txn: Transaction): Promise<void>
  countByCategory(categoryId: string): Promise<number>
}

export interface CategoryRepository {
  list(): Promise<Categories>
  findById(id: string): Promise<(Category & { type: CategoryType }) | null>
  /** The store assigns id (UUID). */
  create(input: CreateCategoryInput): Promise<Category>
  update(id: string, patch: UpdateCategoryInput): Promise<Category | null>
  delete(id: string): Promise<boolean>
}

export interface SettingsRepository {
  get(): Promise<Settings>
  save(settings: Settings): Promise<Settings>
}

export interface LedgerRepository {
  transactions: TransactionRepository
  categories: CategoryRepository
  settings: SettingsRepository
}

export type DbProvider = 'json' | 'supabase'
