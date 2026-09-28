import TransactionEditContainer from '@/modules/transactions/transaction-edit.container'

// Server Component: read params/searchParams here instead of useSearchParams in a
// client page (avoids the "missing Suspense boundary" build error in Next 16).
export default async function EditTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string | string[] }>
}) {
  const { id } = await params
  const { date } = await searchParams
  return <TransactionEditContainer id={id} date={typeof date === 'string' ? date : undefined} />
}
