import { NextRequest } from 'next/server'
import { authed } from '@/server/route'
import { parseYearMonth } from '@/server/validation'
import { getMonthlySummary } from '@/server/services/summary.service'

export function GET(request: NextRequest) {
  return authed(async (session) => {
    const { year, month } = parseYearMonth(request.nextUrl.searchParams)
    return Response.json({ summary: await getMonthlySummary(session, year, month) })
  })
}
