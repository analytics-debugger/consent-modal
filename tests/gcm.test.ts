import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireConsentDefault, fireConsentUpdate } from '../src/gcm'
import type { ConsentState, GCMMapping } from '../src/types'

describe('GCM', () => {
  let gtagCalls: unknown[][]

  const mappings: GCMMapping = {
    ad_storage: 'marketing',
    analytics_storage: 'analytics',
    ad_user_data: 'marketing',
    ad_personalization: 'marketing',
  }

  beforeEach(() => {
    gtagCalls = []
    ;(window as any).dataLayer = []
    ;(window as any).gtag = (...args: unknown[]) => {
      gtagCalls.push(args)
    }
  })

  describe('fireConsentDefault', () => {
    it('calls gtag with consent default', () => {
      const state: ConsentState = { marketing: false, analytics: true }
      fireConsentDefault(state, mappings)

      expect(gtagCalls).toHaveLength(1)
      expect(gtagCalls[0]![0]).toBe('consent')
      expect(gtagCalls[0]![1]).toBe('default')
    })

    it('maps state to granted/denied', () => {
      const state: ConsentState = { marketing: false, analytics: true }
      fireConsentDefault(state, mappings)

      const gcm = gtagCalls[0]![2] as Record<string, string>
      expect(gcm.ad_storage).toBe('denied')
      expect(gcm.analytics_storage).toBe('granted')
      expect(gcm.ad_user_data).toBe('denied')
      expect(gcm.ad_personalization).toBe('denied')
    })

    it('sets wait_for_update to 500', () => {
      const state: ConsentState = { marketing: false, analytics: false }
      fireConsentDefault(state, mappings)

      const gcm = gtagCalls[0]![2] as Record<string, string>
      expect(gcm.wait_for_update).toBe('500')
    })
  })

  describe('fireConsentUpdate', () => {
    it('calls gtag with consent update', () => {
      const state: ConsentState = { marketing: true, analytics: true }
      fireConsentUpdate(state, mappings)

      expect(gtagCalls).toHaveLength(1)
      expect(gtagCalls[0]![0]).toBe('consent')
      expect(gtagCalls[0]![1]).toBe('update')
    })

    it('maps all granted state correctly', () => {
      const state: ConsentState = { marketing: true, analytics: true }
      fireConsentUpdate(state, mappings)

      const gcm = gtagCalls[0]![2] as Record<string, string>
      expect(gcm.ad_storage).toBe('granted')
      expect(gcm.analytics_storage).toBe('granted')
      expect(gcm.ad_user_data).toBe('granted')
      expect(gcm.ad_personalization).toBe('granted')
    })
  })

  describe('ensureGtag', () => {
    it('creates gtag function if not present', () => {
      delete (window as any).gtag
      delete (window as any).dataLayer

      const state: ConsentState = { marketing: false }
      fireConsentDefault(state, mappings)

      expect(window.dataLayer).toBeDefined()
      expect(typeof window.gtag).toBe('function')
    })
  })
})
