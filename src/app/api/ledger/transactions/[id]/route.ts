import { NextRequest } from 'next/server'
import { readBody } from '@/server/errors'
import { authed } from '@/server/route'
import { deleteTransaction, getTransaction, updateTransaction } from '@/server/services/transaction.service'

type Ctx = { params: Promise<{ id: string }> }

// `?date=YYYY-MM-DD` is an optional lookup hint for the JSON provider.
const dateHint = (request: NextRequest) => request.nextUrl.searchParams.get('date') ?? undefined

export function GET(request: NextRequest, ctx: Ctx) {
  return authed(async (session) => {
    const { id } = await ctx.params
    return Response.json({ transaction: await getTransaction(session, id, dateHint(request)) })
  })
}

export function PUT(request: NextRequest, ctx: Ctx) {
  return authed(async (session) => {
    const { id } = await ctx.params
    const transaction = await updateTransaction(session, id, await readBody(request), dateHint(request))
    return Response.json({ transaction })
  })
}

export function DELETE(request: NextRequest, ctx: Ctx) {
  return authed(async (session) => {
    const { id } = await ctx.params
    await deleteTransaction(session, id, dateHint(request))
    return Response.json({ success: true })
  })
}
