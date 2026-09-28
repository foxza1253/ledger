export interface MonthlySummary {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
  byCategory: {
    categoryId: string
    type: 'income' | 'expense'
    total: number
    count: number
  }[]
  dailyBreakdown: {
    date: string
    income: number
    expense: number
  }[]
}

export interface TrendPoint {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  balance: number
}
