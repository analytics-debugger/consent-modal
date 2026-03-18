// No global CSS import — styles are injected into Shadow DOM
import type { ConsentModalOptions, ConsentState, ConsentCategory, ConsentCategoryTranslation, ConsentTexts, GCMMapping, ConsentLocale } from './types'
import { getCookie, setCookie } from './cookies'
import { fireConsentDefault, fireConsentUpdate } from './gcm'
import { createDOM } from './render'

export type { ConsentModalOptions, ConsentState, ConsentCategory, ConsentTexts, GCMMapping, ConsentLocale, ConsentCategoryTranslation } from './types'

const DEFAULT_GCM_MAPPINGS: GCMMapping = {
  ad_storage: 'marketing',
  analytics_storage: 'analytics',
  ad_user_data: 'marketing',
  ad_personalization: 'marketing',
}

export class ConsentModal {
  private opts: Required<Pick<ConsentModalOptions, 'categories' | 'cookieName' | 'cookieDays' | 'autoShow'>> & ConsentModalOptions
  private state: ConsentState = {}
  private dom: ReturnType<typeof createDOM> | null = null
  private isOpen = false
  private gcmMappings: GCMMapping
  private initialDefaultFired = false
  private currentLocale: string

  constructor(options: ConsentModalOptions) {
    this.opts = {
      cookieName: 'dta_consent',
      cookieDays: 365,
      autoShow: true,
      ...options,
    }

    this.gcmMappings = this.opts.gcmMappings || DEFAULT_GCM_MAPPINGS
    this.currentLocale = this.opts.defaultLocale || (this.opts.detectLocale ? this.detectLocale() : 'en')

    // Initialize state from categories
    for (const cat of this.opts.categories) {
      this.state[cat.key] = cat.locked ? true : (cat.default ?? false)
    }

    // Load saved state
    const saved = this.loadSaved()
    if (saved) {
      for (const key of Object.keys(this.state)) {
        if (key in saved) this.state[key] = saved[key]
      }
    }

    // Fire initial GCM default
    this.fireGCMDefault()

    // If saved, fire update too
    if (saved) {
      this.fireGCMUpdate()
    }

    // Auto show if no consent saved
    if (this.opts.autoShow && !saved) {
      requestAnimationFrame(() => this.show())
    }

    // Listen for custom events
    window.addEventListener('consent-modal:open', () => this.show())
    window.addEventListener('consent-modal:settings', () => this.showSettings())
  }

  // --- i18n ---

  private detectLocale(): string {
    const nav = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en'
    const lang = nav.split('-')[0]!.toLowerCase()
    // Check if we have this locale
    if (this.opts.locales && lang in this.opts.locales) return lang
    // Try full code (e.g. pt-BR)
    const full = nav.toLowerCase()
    if (this.opts.locales && full in this.opts.locales) return full
    return 'en'
  }

  private getLocaleData(): ConsentLocale | undefined {
    if (!this.opts.locales) return undefined
    return this.opts.locales[this.currentLocale]
  }

  private resolveTexts(): ConsentTexts {
    const localeData = this.getLocaleData()
    if (!localeData) return {}
    const { categories, ...texts } = localeData
    return texts
  }

  private resolveCategories(): (ConsentCategory & ConsentCategoryTranslation)[] {
    const localeData = this.getLocaleData()

    return this.opts.categories.map(cat => {
      const translation = localeData?.categories?.[cat.key]
      return {
        ...cat,
        label: translation?.label || cat.key,
        description: translation?.description || '',
        sublabel: translation?.sublabel,
        emoji: translation?.emoji,
      }
    })
  }

  // --- Cookie ---

  private loadSaved(): ConsentState | null {
    const raw = getCookie(this.opts.cookieName)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  private save(): void {
    const existing = this.loadSaved() as Record<string, unknown> | null
    const now = Date.now()
    const data: Record<string, unknown> = {
      ...this.state,
      created_timestamp: existing?.created_timestamp || now,
      updated_timestamp: now,
    }
    setCookie(this.opts.cookieName, JSON.stringify(data), this.opts.cookieDays, {
      domain: this.opts.cookieDomain || 'auto',
      sameSite: this.opts.cookieSameSite,
      secure: this.opts.cookieSecure,
    })
  }

  // --- GCM ---

  private fireGCMDefault(): void {
    if (this.initialDefaultFired) return
    this.initialDefaultFired = true
    fireConsentDefault(this.state, this.gcmMappings)
  }

  private fireGCMUpdate(): void {
    fireConsentUpdate(this.state, this.gcmMappings)
  }

  // --- DOM ---

  private ensureDOM(): ReturnType<typeof createDOM> {
    if (this.dom) return this.dom

    const saved = this.loadSaved()

    this.dom = createDOM({
      categories: this.resolveCategories(),
      state: this.state,
      texts: this.resolveTexts(),
      logoUrl: this.opts.logoUrl,
      privacyPolicyUrl: this.opts.privacyPolicyUrl,
      accentColor: this.opts.accentColor,
      canDismiss: !!saved && !this.opts.blockNavigation,
      onAcceptAll: () => this.acceptAll(),
      onRejectAll: () => this.rejectAll(),
      onSave: () => this.saveAndClose(),
      onDismiss: () => this.hide(),
      onToggle: (key) => this.toggle(key),
    })

    // Apply dark mode
    if (this.isDarkMode()) {
      this.dom.host.classList.add('dark')
    }

    document.body.appendChild(this.dom.host)

    return this.dom
  }

  private isDarkMode(): boolean {
    if (this.opts.darkMode === true) return true
    if (this.opts.darkMode === false) return false
    if (this.opts.darkMode === 'auto') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    }
    return false
  }

  private blockNavigationHandler = (e: BeforeUnloadEvent) => {
    e.preventDefault()
  }

  private blockNavigation(): void {
    if (!this.opts.blockNavigation) return
    window.addEventListener('beforeunload', this.blockNavigationHandler)
    // Block history navigation
    history.pushState(null, '', location.href)
    window.addEventListener('popstate', this.popstateHandler)
  }

  private unblockNavigation(): void {
    window.removeEventListener('beforeunload', this.blockNavigationHandler)
    window.removeEventListener('popstate', this.popstateHandler)
  }

  private popstateHandler = () => {
    if (this.isOpen) {
      history.pushState(null, '', location.href)
    }
  }

  private toggle(key: string): void {
    const cat = this.opts.categories.find(c => c.key === key)
    if (cat?.locked) return
    this.state[key] = !this.state[key]
    this.dom?.updateToggles()
    this.opts.onChange?.(this.getState())
  }

  private acceptAll(): void {
    for (const cat of this.opts.categories) {
      this.state[cat.key] = true
    }
    this.save()
    this.fireGCMUpdate()
    this.opts.onAcceptAll?.(this.getState())
    this.opts.onChange?.(this.getState())
    this.hide()
  }

  private rejectAll(): void {
    for (const cat of this.opts.categories) {
      this.state[cat.key] = !!cat.locked
    }
    this.save()
    this.fireGCMUpdate()
    this.opts.onRejectAll?.(this.getState())
    this.opts.onChange?.(this.getState())
    this.hide()
  }

  private saveAndClose(): void {
    this.save()
    this.fireGCMUpdate()
    this.opts.onSave?.(this.getState())
    this.opts.onChange?.(this.getState())
    this.hide()
  }

  // --- Public API ---

  private shadowQuery(sel: string): Element | null {
    return this.dom?.host.shadowRoot?.querySelector(sel) ?? null
  }

  show(): void {
    const dom = this.ensureDOM()
    dom.showMain()
    this.isOpen = true
    document.body.style.overflow = 'hidden'
    this.blockNavigation()

    requestAnimationFrame(() => {
      this.shadowQuery('.cm-backdrop')?.classList.add('cm-visible')
      this.shadowQuery('.cm-card')?.classList.add('cm-visible')
    })
  }

  showSettings(): void {
    const dom = this.ensureDOM()

    const saved = this.loadSaved()
    if (saved) {
      for (const key of Object.keys(this.state)) {
        if (key in saved) this.state[key] = saved[key]
      }
      dom.updateToggles()
    }

    dom.showDetails()
    this.isOpen = true
    document.body.style.overflow = 'hidden'

    requestAnimationFrame(() => {
      this.shadowQuery('.cm-backdrop')?.classList.add('cm-visible')
      this.shadowQuery('.cm-card')?.classList.add('cm-visible')
    })
  }

  hide(): void {
    if (!this.dom) return
    this.isOpen = false
    document.body.style.overflow = ''
    this.unblockNavigation()

    this.shadowQuery('.cm-backdrop')?.classList.remove('cm-visible')
    this.shadowQuery('.cm-card')?.classList.remove('cm-visible')

    setTimeout(() => {
      this.dom?.destroy()
      this.dom = null
    }, 300)
  }

  /** Change locale and rebuild the DOM on next show */
  setLocale(locale: string): void {
    this.currentLocale = locale
    if (this.dom) {
      this.dom.destroy()
      this.dom = null
    }
  }

  getLocale(): string {
    return this.currentLocale
  }

  getState(): ConsentState {
    return { ...this.state }
  }

  isGranted(key: string): boolean {
    return !!this.state[key]
  }

  destroy(): void {
    this.hide()
    window.removeEventListener('consent-modal:open', () => this.show())
    window.removeEventListener('consent-modal:settings', () => this.showSettings())
  }
}

// Convenience factory
export function createConsentModal(options: ConsentModalOptions): ConsentModal {
  return new ConsentModal(options)
}
