import { NextRequest } from 'next/server'
import { readBody } from '@/server/errors'
import { authed } from '@/server/route'
import { parseYearMonth } from '@/server/validation'
import { createTransaction, listTransactions } from '@/server/services/transaction.service'

export function GET(request: NextRequest) {
  return authed(async (session) => {
    const params = request.nextUrl.searchParams
    const { year, month } = parseYearMonth(params)
    const transactions = await listTransactions(session, year, month, {
      type: params.get('type'),
      categoryId: params.get('categoryId'),
    })
    return Response.json({ transactions })
  })
}

export function POST(request: NextRequest) {
  return authed(async (session) => {
    const transaction = await createTransaction(session, await readBody(request))
    return Response.json({ transaction }, { status: 201 })
  })
}
