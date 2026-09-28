'use client'

import { useCallback } from 'react'
import { SearchX } from 'lucide-react'
import { api, ApiClientError } from '@/lib/api-client'
import { useQuery } from '@/common/hooks/use-query'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import TransactionFormContainer from './transaction-form.container'
import type { Transaction } from '@/common/type/interface'

export default function TransactionEditContainer({ id, date }: { id: string; date?: string }) {
  const fetcher = useCallback(async (signal: AbortSignal) => {
    const q = date ? `?${new URLSearchParams({ date })}` : ''
    return (await api<{ transaction: Transaction }>(`/transactions/${encodeURIComponent(id)}${q}`, { signal })).transaction
  }, [id, date])
  const { data, loading, error, reload } = useQuery(`txn:${id}`, fetcher)

  if (error instanceof ApiClientError && error.status === 404) {
    return (
      <div className="card mx-auto max-w-xl">
        <EmptyState icon={SearchX} title="ไม่พบรายการนี้" description="รายการอาจถูกลบไปแล้ว"
          action={{ href: '/transactions', label: 'กลับไปหน้าธุรกรรม' }} />
      </div>
    )
  }
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading || !data) {
    return (
      <div className="card mx-auto max-w-xl space-y-5 p-6" aria-busy="true">
        <div className="skeleton h-12 w-full rounded-2xl" />
        <div className="skeleton h-20 w-full rounded-2xl" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    )
  }
  return <TransactionFormContainer key={data.id} initial={data} />
}
