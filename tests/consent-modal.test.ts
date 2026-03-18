import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ConsentModal, createConsentModal } from '../src/index'
import type { ConsentModalOptions } from '../src/types'

function makeOptions(overrides: Partial<ConsentModalOptions> = {}): ConsentModalOptions {
  return {
    autoShow: false,
    categories: [
      { key: 'necessary', label: 'Necessary', description: 'Required cookies', locked: true },
      { key: 'analytics', label: 'Analytics', description: 'Analytics cookies', default: false },
      { key: 'marketing', label: 'Marketing', description: 'Marketing cookies', default: false },
    ],
    ...overrides,
  }
}

function clearCookies() {
  document.cookie.split(';').forEach(c => {
    const name = c.split('=')[0]!.trim()
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`
    }
  })
}

describe('ConsentModal', () => {
  let gtagCalls: unknown[][]

  beforeEach(() => {
    clearCookies()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    gtagCalls = []
    ;(window as any).dataLayer = []
    ;(window as any).gtag = (...args: unknown[]) => {
      gtagCalls.push(args)
    }
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  it('creates instance with categories', () => {
    const modal = new ConsentModal(makeOptions())
    expect(modal).toBeInstanceOf(ConsentModal)
  })

  it('createConsentModal factory works', () => {
    const modal = createConsentModal(makeOptions())
    expect(modal).toBeInstanceOf(ConsentModal)
  })

  it('auto-shows when no cookie exists', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0 })
    new ConsentModal(makeOptions({ autoShow: true }))
    expect(document.body.querySelector('#consent-modal-root')).not.toBeNull()
    rafSpy.mockRestore()
  })

  it('does not auto-show when cookie exists', () => {
    document.cookie = `dta_consent=${encodeURIComponent(JSON.stringify({ necessary: true, analytics: false, marketing: false }))};path=/`
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0 })
    new ConsentModal(makeOptions({ autoShow: true }))
    expect(document.body.querySelector('#consent-modal-root')).toBeNull()
    rafSpy.mockRestore()
  })

  it('does not auto-show when autoShow is false', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0 })
    new ConsentModal(makeOptions({ autoShow: false }))
    expect(document.body.querySelector('#consent-modal-root')).toBeNull()
    rafSpy.mockRestore()
  })

  it('acceptAll sets all categories to true and saves cookie', () => {
    const onChange = vi.fn()
    const modal = new ConsentModal(makeOptions({ onChange }))
    modal.show()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    ;(shadow.querySelector('[data-consent-accept]') as HTMLElement).click()

    const state = modal.getState()
    expect(state.necessary).toBe(true)
    expect(state.analytics).toBe(true)
    expect(state.marketing).toBe(true)
    expect(onChange).toHaveBeenCalled()
  })

  it('rejectAll sets locked categories true, others false', () => {
    const modal = new ConsentModal(makeOptions())
    modal.show()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    ;(shadow.querySelector('[data-consent-reject]') as HTMLElement).click()

    expect(modal.getState()).toEqual({ necessary: true, analytics: false, marketing: false })
  })

  it('toggle flips non-locked categories', () => {
    const modal = new ConsentModal(makeOptions())
    modal.show()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    const toggle = shadow.querySelector('[data-consent-toggle="analytics"]') as HTMLElement

    expect(modal.getState().analytics).toBe(false)
    toggle.click()
    expect(modal.getState().analytics).toBe(true)
    toggle.click()
    expect(modal.getState().analytics).toBe(false)
  })

  it('toggle does not flip locked categories', () => {
    const modal = new ConsentModal(makeOptions())
    modal.show()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    const toggle = shadow.querySelector('[data-consent-toggle="necessary"]') as HTMLElement
    if (toggle) toggle.click()
    expect(modal.getState().necessary).toBe(true)
  })

  it('getState returns current state', () => {
    const modal = new ConsentModal(makeOptions())
    expect(modal.getState()).toEqual({ necessary: true, analytics: false, marketing: false })
  })

  it('isGranted returns correct boolean', () => {
    const modal = new ConsentModal(makeOptions())
    expect(modal.isGranted('necessary')).toBe(true)
    expect(modal.isGranted('analytics')).toBe(false)
    expect(modal.isGranted('nonexistent')).toBe(false)
  })

  it('show/hide toggle body overflow', () => {
    const modal = new ConsentModal(makeOptions())
    modal.show()
    expect(document.body.style.overflow).toBe('hidden')
    modal.hide()
    expect(document.body.style.overflow).toBe('')
  })

  it('hide without show does nothing', () => {
    const modal = new ConsentModal(makeOptions())
    modal.hide() // should not throw
    expect(document.body.style.overflow).toBe('')
  })

  it('fires onAcceptAll callback', () => {
    const onAcceptAll = vi.fn()
    const modal = new ConsentModal(makeOptions({ onAcceptAll }))
    modal.show()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    ;(shadow.querySelector('[data-consent-accept]') as HTMLElement).click()

    expect(onAcceptAll).toHaveBeenCalledWith(expect.objectContaining({ necessary: true, analytics: true, marketing: true }))
  })

  it('fires onRejectAll callback', () => {
    const onRejectAll = vi.fn()
    const modal = new ConsentModal(makeOptions({ onRejectAll }))
    modal.show()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    ;(shadow.querySelector('[data-consent-reject]') as HTMLElement).click()

    expect(onRejectAll).toHaveBeenCalledWith(expect.objectContaining({ necessary: true, analytics: false, marketing: false }))
  })

  it('fires onSave callback', () => {
    const onSave = vi.fn()
    const modal = new ConsentModal(makeOptions({ onSave }))
    modal.show()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    ;(shadow.querySelector('[data-consent-save]') as HTMLElement).click()

    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('fires onChange on toggle', () => {
    const onChange = vi.fn()
    const modal = new ConsentModal(makeOptions({ onChange }))
    modal.show()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    ;(shadow.querySelector('[data-consent-toggle="analytics"]') as HTMLElement).click()

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ analytics: true }))
  })

  it('saves cookie with timestamps', () => {
    const now = 1710000000000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const modal = new ConsentModal(makeOptions())
    modal.show()
    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    ;(shadow.querySelector('[data-consent-accept]') as HTMLElement).click()

    const raw = document.cookie.match(/dta_consent=([^;]*)/)?.[1]
    const data = JSON.parse(decodeURIComponent(raw!))
    expect(data.created_timestamp).toBe(now)
    expect(data.updated_timestamp).toBe(now)

    vi.restoreAllMocks()
  })

  it('preserves created_timestamp on subsequent saves', () => {
    vi.restoreAllMocks()
    clearCookies()
    document.body.innerHTML = ''

    const cookieName = 'ts_test'
    const nowMock = vi.spyOn(Date, 'now').mockReturnValue(1000000)

    const modal = new ConsentModal(makeOptions({ cookieName }))
    modal.show()
    ;(document.body.querySelector('#consent-modal-root')!.shadowRoot!.querySelector('[data-consent-accept]') as HTMLElement).click()

    nowMock.mockReturnValue(2000000)
    document.body.innerHTML = ''
    const modal2 = new ConsentModal(makeOptions({ cookieName }))
    modal2.show()
    ;(document.body.querySelector('#consent-modal-root')!.shadowRoot!.querySelector('[data-consent-accept]') as HTMLElement).click()

    const raw = document.cookie.match(new RegExp(`${cookieName}=([^;]*)`))?.[1]
    const data = JSON.parse(decodeURIComponent(raw!))
    expect(data.created_timestamp).toBe(1000000)
    expect(data.updated_timestamp).toBe(2000000)

    vi.restoreAllMocks()
  })

  // --- GCM ---

  it('fires GCM consent default on init', () => {
    new ConsentModal(makeOptions())
    expect(gtagCalls.find(c => c[0] === 'consent' && c[1] === 'default')).toBeDefined()
  })

  it('fires GCM consent update on accept', () => {
    const modal = new ConsentModal(makeOptions())
    modal.show()
    const before = gtagCalls.length
    ;(document.body.querySelector('#consent-modal-root')!.shadowRoot!.querySelector('[data-consent-accept]') as HTMLElement).click()
    expect(gtagCalls.slice(before).find(c => c[0] === 'consent' && c[1] === 'update')).toBeDefined()
  })

  it('fires GCM update with saved state on init', () => {
    document.cookie = `dta_consent=${encodeURIComponent(JSON.stringify({ necessary: true, analytics: true, marketing: false }))};path=/`
    new ConsentModal(makeOptions())
    const updateCall = gtagCalls.find(c => c[0] === 'consent' && c[1] === 'update')
    expect(updateCall).toBeDefined()
    expect((updateCall![2] as any).analytics_storage).toBe('granted')
  })

  // --- Dark mode ---

  it('darkMode true adds dark class', () => {
    const modal = new ConsentModal(makeOptions({ darkMode: true }))
    modal.show()
    expect(document.body.querySelector('#consent-modal-root')!.classList.contains('dark')).toBe(true)
  })

  it('darkMode false does not add dark class', () => {
    const modal = new ConsentModal(makeOptions({ darkMode: false }))
    modal.show()
    expect(document.body.querySelector('#consent-modal-root')!.classList.contains('dark')).toBe(false)
  })

  it('darkMode auto detects system preference', () => {
    const spy = vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true, media: '', addEventListener: vi.fn(), removeEventListener: vi.fn(),
      addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(), onchange: null,
    } as MediaQueryList)

    const modal = new ConsentModal(makeOptions({ darkMode: 'auto' }))
    modal.show()
    expect(document.body.querySelector('#consent-modal-root')!.classList.contains('dark')).toBe(true)
    spy.mockRestore()
  })

  it('darkMode undefined does not add dark class', () => {
    const modal = new ConsentModal(makeOptions())
    modal.show()
    expect(document.body.querySelector('#consent-modal-root')!.classList.contains('dark')).toBe(false)
  })

  // --- Block navigation ---

  it('blockNavigation adds beforeunload listener on show', () => {
    const spy = vi.spyOn(window, 'addEventListener')
    const modal = new ConsentModal(makeOptions({ blockNavigation: true }))
    modal.show()
    expect(spy.mock.calls.some(c => c[0] === 'beforeunload')).toBe(true)
    spy.mockRestore()
  })

  it('blockNavigation removes listener on hide', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const modal = new ConsentModal(makeOptions({ blockNavigation: true }))
    modal.show()
    modal.hide()
    expect(removeSpy.mock.calls.some(c => c[0] === 'beforeunload')).toBe(true)
    removeSpy.mockRestore()
  })

  it('blockNavigation prevents dismiss via canDismiss', () => {
    const modal = new ConsentModal(makeOptions({ blockNavigation: true }))
    modal.show()
    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    // Close button should not exist when blockNavigation + no saved consent
    const closeBtn = shadow.querySelector('[data-consent-close]')
    expect(closeBtn).toBeNull()
  })

  // --- Locale ---

  it('setLocale changes locale and rebuilds DOM', () => {
    const modal = new ConsentModal(makeOptions({
      defaultLocale: 'en',
      locales: {
        en: { heading: 'English' },
        es: { heading: 'Espanol' },
      },
    }))

    expect(modal.getLocale()).toBe('en')
    modal.show()

    modal.setLocale('es')
    expect(modal.getLocale()).toBe('es')

    // DOM should be destroyed
    modal.show()
    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    const heading = shadow.querySelector('.cm-heading')
    expect(heading?.textContent).toBe('Espanol')
  })

  it('detectLocale picks matching locale from navigator', () => {
    const langSpy = vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES')
    const modal = new ConsentModal(makeOptions({
      detectLocale: true,
      locales: {
        es: { heading: 'Hola' },
      },
    }))
    expect(modal.getLocale()).toBe('es')
    langSpy.mockRestore()
  })

  it('detectLocale falls back to en when no match', () => {
    const langSpy = vi.spyOn(navigator, 'language', 'get').mockReturnValue('xx-XX')
    const modal = new ConsentModal(makeOptions({
      detectLocale: true,
      locales: { es: { heading: 'Hola' } },
    }))
    expect(modal.getLocale()).toBe('en')
    langSpy.mockRestore()
  })

  it('resolves category translations from locale', () => {
    const modal = new ConsentModal(makeOptions({
      defaultLocale: 'es',
      locales: {
        es: {
          categories: {
            analytics: { label: 'Analítica', description: 'Desc ES' },
          },
        },
      },
    }))
    modal.show()
    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    const labels = Array.from(shadow.querySelectorAll('.cm-category-label'))
    const analyticsLabel = labels.find(l => l.textContent?.includes('Analítica'))
    expect(analyticsLabel).toBeDefined()
  })

  // --- showSettings ---

  it('showSettings opens details screen', () => {
    const modal = new ConsentModal(makeOptions())
    modal.showSettings()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    const mainScreen = shadow.querySelector('[data-consent-screen="main"]') as HTMLElement
    const detailsScreen = shadow.querySelector('[data-consent-screen="details"]') as HTMLElement
    expect(mainScreen.style.display).toBe('none')
    expect(detailsScreen.style.display).toBe('')
  })

  it('showSettings loads saved state', () => {
    document.cookie = `dta_consent=${encodeURIComponent(JSON.stringify({ necessary: true, analytics: true, marketing: false }))};path=/`
    const modal = new ConsentModal(makeOptions())
    modal.showSettings()
    expect(modal.getState().analytics).toBe(true)
  })

  // --- Customize screen navigation ---

  it('customize button switches to details', () => {
    const modal = new ConsentModal(makeOptions())
    modal.show()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    ;(shadow.querySelector('[data-consent-customize]') as HTMLElement).click()

    const mainScreen = shadow.querySelector('[data-consent-screen="main"]') as HTMLElement
    expect(mainScreen.style.display).toBe('none')
  })

  it('back button returns to main', () => {
    const modal = new ConsentModal(makeOptions())
    modal.show()

    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    ;(shadow.querySelector('[data-consent-customize]') as HTMLElement).click()
    ;(shadow.querySelector('[data-consent-back]') as HTMLElement).click()

    const mainScreen = shadow.querySelector('[data-consent-screen="main"]') as HTMLElement
    expect(mainScreen.style.display).toBe('')
  })

  // --- destroy ---

  it('destroy removes modal and cleans up', () => {
    const modal = new ConsentModal(makeOptions())
    modal.show()
    expect(document.body.querySelector('#consent-modal-root')).not.toBeNull()
    modal.destroy()
    expect(document.body.style.overflow).toBe('')
  })

  // --- Custom events ---

  it('responds to consent-modal:open event', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0 })
    new ConsentModal(makeOptions())
    window.dispatchEvent(new Event('consent-modal:open'))
    expect(document.body.querySelector('#consent-modal-root')).not.toBeNull()
    rafSpy.mockRestore()
  })

  it('responds to consent-modal:settings event', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0 })
    new ConsentModal(makeOptions())
    window.dispatchEvent(new Event('consent-modal:settings'))
    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    const details = shadow.querySelector('[data-consent-screen="details"]') as HTMLElement
    expect(details.style.display).toBe('')
    rafSpy.mockRestore()
  })

  // --- Logo & privacy URL ---

  it('renders logo when logoUrl provided', () => {
    const modal = new ConsentModal(makeOptions({ logoUrl: '/test-logo.svg' }))
    modal.show()
    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    const logo = shadow.querySelector('.cm-logo') as HTMLImageElement
    expect(logo).not.toBeNull()
    expect(logo.src).toContain('test-logo.svg')
  })

  it('renders footer when privacyPolicyUrl provided', () => {
    const modal = new ConsentModal(makeOptions({ privacyPolicyUrl: '/privacy' }))
    modal.show()
    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    const footer = shadow.querySelector('.cm-footer')
    expect(footer).not.toBeNull()
    expect(footer?.querySelector('a')?.getAttribute('href')).toBe('/privacy')
  })

  it('does not render footer without privacyPolicyUrl', () => {
    const modal = new ConsentModal(makeOptions())
    modal.show()
    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    expect(shadow.querySelector('.cm-footer')).toBeNull()
  })

  // --- Custom cookie options ---

  it('uses custom cookie name', () => {
    const modal = new ConsentModal(makeOptions({ cookieName: 'my_custom_consent' }))
    modal.show()
    ;(document.body.querySelector('#consent-modal-root')!.shadowRoot!.querySelector('[data-consent-accept]') as HTMLElement).click()
    expect(document.cookie).toContain('my_custom_consent=')
  })

  // --- Accent color ---

  it('applies custom accent color', () => {
    const modal = new ConsentModal(makeOptions({ accentColor: '#ff0000' }))
    modal.show()
    const shadow = document.body.querySelector('#consent-modal-root')!.shadowRoot!
    const card = shadow.querySelector('.cm-card') as HTMLElement
    expect(card.style.getPropertyValue('--cm-accent')).toBe('#ff0000')
  })

  // --- Default category state ---

  it('respects default: true on categories', () => {
    const modal = new ConsentModal(makeOptions({
      categories: [
        { key: 'necessary', label: 'N', description: 'n', locked: true },
        { key: 'analytics', label: 'A', description: 'a', default: true },
      ],
    }))
    expect(modal.getState().analytics).toBe(true)
  })
})
