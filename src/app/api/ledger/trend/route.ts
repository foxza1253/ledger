import { NextRequest } from 'next/server'
import { authed } from '@/server/route'
import { parseYearMonth } from '@/server/validation'
import { getTrend } from '@/server/services/summary.service'

export function GET(request: NextRequest) {
  return authed(async (session) => {
    const params = request.nextUrl.searchParams
    const { year, month } = parseYearMonth(params)
    const months = Math.min(24, Math.max(1, Number(params.get('months')) || 6))
    return Response.json({ trend: await getTrend(session, year, month, months) })
  })
}
