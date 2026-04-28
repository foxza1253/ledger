export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  date: string // YYYY-MM-DD
  type: TransactionType
  categoryId: string
  amount: number
  description: string
  note?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface MonthlyFile {
  year: number
  month: number
  transactions: Transaction[]
}

export type CreateTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateTransactionInput = Partial<CreateTransactionInput>
