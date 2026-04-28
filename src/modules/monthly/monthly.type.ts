export interface MonthlySummary {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  balance: number
  byCategory: {
    categoryId: string
    total: number
  }[]
  dailyBreakdown: {
    date: string
    income: number
    expense: number
  }[]
}
