import type { ConsentState, GCMMapping } from './types'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== 'function') {
    window.gtag = function () {
      window.dataLayer.push(arguments)
    }
  }
}

function buildGCMState(state: ConsentState, mappings: GCMMapping): Record<string, string> {
  const gcm: Record<string, string> = {}
  for (const [gcmKey, categoryKey] of Object.entries(mappings)) {
    if (categoryKey) {
      gcm[gcmKey] = state[categoryKey] ? 'granted' : 'denied'
    }
  }
  return gcm
}

export function fireConsentDefault(state: ConsentState, mappings: GCMMapping): void {
  ensureGtag()
  const gcm = buildGCMState(state, mappings)
  gcm.wait_for_update = '500'
  window.gtag('consent', 'default', gcm)
}

export function fireConsentUpdate(state: ConsentState, mappings: GCMMapping): void {
  ensureGtag()
  const gcm = buildGCMState(state, mappings)
  gcm.wait_for_update = '500'
  window.gtag('consent', 'update', gcm)
}
