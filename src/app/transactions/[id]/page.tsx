'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import TransactionFormContainer from '@/modules/transactions/transaction-form.container'
import { fetchTransaction } from '@/modules/transactions/transaction.service'
import type { Transaction } from '@/common/type/interface'

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const date = searchParams.get('date') ?? ''
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState('')

  useEffect(() => {
    params.then(({ id }) => {
      setId(id)
      fetchTransaction(id, date)
        .then((txn) => setTransaction(txn))
        .finally(() => setLoading(false))
    })
  }, [params, date])

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">กำลังโหลด...</div>
  }

  if (!transaction) {
    return <div className="py-20 text-center text-gray-400">ไม่พบรายการ (id: {id})</div>
  }

  return <TransactionFormContainer initial={transaction} />
}
