export type { Transaction, MonthlyFile, TransactionType, CreateTransactionInput, UpdateTransactionInput } from '@/modules/transactions/transaction.type'
export type { MonthlySummary, TrendPoint } from '@/modules/monthly/monthly.type'
export type { Category, Categories, CategoryType, CreateCategoryInput, UpdateCategoryInput } from '@/modules/categories/category.type'

export interface Settings {
  currency: string
  currencySymbol: string
  locale: string
  monthlyBudget: {
    enabled: boolean
    amount: number
  }
  startDayOfMonth: number
}

export const DEFAULT_SETTINGS: Settings = {
  currency: 'THB',
  currencySymbol: '฿',
  locale: 'th-TH',
  monthlyBudget: { enabled: true, amount: 30000 },
  startDayOfMonth: 1,
}
