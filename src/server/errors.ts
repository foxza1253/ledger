export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const badRequest = (message: string, details?: Record<string, string>) => new ApiError(400, message, details)
export const notFound = (message = 'ไม่พบข้อมูล') => new ApiError(404, message)
export const conflict = (message: string) => new ApiError(409, message)

/** Runs a route body and converts thrown errors into JSON responses. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (err) {
    if (err instanceof ApiError) {
      return Response.json({ error: err.message, details: err.details }, { status: err.status })
    }
    console.error('[ledger api]', err)
    return Response.json({ error: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 })
  }
}

export async function readBody<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw badRequest('รูปแบบข้อมูล (JSON) ไม่ถูกต้อง')
  }
}
