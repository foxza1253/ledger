import type { MonthlySummary, Transaction } from '@/common/type/interface'

export interface DashboardData {
  summary: MonthlySummary
  recentTransactions: Transaction[]
}
