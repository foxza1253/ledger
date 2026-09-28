export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

interface RequestInit_ { method?: string; body?: unknown; signal?: AbortSignal }

async function request<T>(url: string, init: RequestInit_, redirectOn401: boolean): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method: init.method ?? 'GET',
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiClientError(0, 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต')
  }
  const data = await res.json().catch(() => null)
  if (res.status === 401 && redirectOn401 && typeof window !== 'undefined') {
    // Session expired or missing — back to login, then return here.
    const here = window.location.pathname + window.location.search
    window.location.assign(`/login?next=${encodeURIComponent(here)}`)
  }
  if (!res.ok) {
    throw new ApiClientError(res.status, data?.error ?? `เกิดข้อผิดพลาด (${res.status})`, data?.details)
  }
  return data as T
}

/** fetch wrapper for /api/ledger — throws ApiClientError with the server message on non-2xx. */
export function api<T>(path: string, init: RequestInit_ = {}): Promise<T> {
  return request<T>(`/api/ledger${path}`, init, true)
}

/** /api/auth endpoints — a 401 here is a normal answer (wrong password), not a redirect. */
export function authApi<T>(path: string, init: RequestInit_ = {}): Promise<T> {
  return request<T>(`/api/auth${path}`, init, false)
}

export function errorMessage(err: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่'): string {
  if (err instanceof ApiClientError) {
    const detail = err.details && Object.values(err.details)[0]
    return detail ? `${err.message}: ${detail}` : err.message
  }
  return fallback
}
