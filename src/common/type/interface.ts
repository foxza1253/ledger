export type { Transaction, MonthlyFile, TransactionType, CreateTransactionInput, UpdateTransactionInput } from '@/modules/transactions/transaction.type'
export type { MonthlySummary } from '@/modules/monthly/monthly.type'
export type { Category, Categories } from '@/modules/categories/category.type'

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
