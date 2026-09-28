'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * false during prerender + hydration, true afterwards. Use to gate UI that depends on
 * "now" (today's date, current month): static pages are prerendered at build time, so
 * rendering those values on the server would bake in the build date.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
