'use client'

import { useEffect, useState } from 'react'

interface QueryState<T> {
  key: string
  data: T | undefined
  error: unknown
}

/**
 * Minimal race-safe data hook: results for a stale `key` are dropped, and
 * `loading` is derived (no setState inside the effect body).
 * `fetcher` should be stable per key (wrap with useCallback).
 */
export function useQuery<T>(key: string, fetcher: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<QueryState<T>>({ key: '', data: undefined, error: null })
  const [version, setVersion] = useState(0)
  const fullKey = `${key}#${version}`

  useEffect(() => {
    const controller = new AbortController()
    fetcher(controller.signal).then(
      (data) => setState({ key: fullKey, data, error: null }),
      (error) => {
        if (!controller.signal.aborted) setState((s) => ({ key: fullKey, data: s.data, error }))
      },
    )
    return () => controller.abort()
  }, [fullKey, fetcher])

  const settled = state.key === fullKey
  return {
    data: state.data,
    error: settled ? state.error : null,
    /** true until the current key has resolved (previous data stays available for smooth transitions) */
    loading: !settled,
    reload: () => setVersion((v) => v + 1),
  }
}
