import type { ConsentCategory, ConsentCategoryTranslation, ConsentState, ConsentTexts } from './types'
import stylesCSS from './styles.css?raw'

// Only the complex templates stay as files — small ones are inlined
import categoryHTML from '../templates/parts/category.html?raw'

const D: ConsentTexts = {
  heading: 'Privacy comes first',
  subheading: 'We respect your privacy and give you full control',
  description: 'This site uses cookies to help us improve. We only use what\'s necessary.',
  acceptAll: 'Accept all',
  rejectAll: 'Reject all',
  customize: 'Customize',
  customizeHeading: 'Your preferences',
  customizeSubheading: 'Toggle what you\'re comfortable with',
  saveChoices: 'Save choices',
  back: '\u2190 Back',
  footerText: 'Change anytime in our',
  privacyPolicyLink: 'privacy policy',
}

type ResolvedCategory = ConsentCategory & ConsentCategoryTranslation

interface RenderOptions {
  categories: ResolvedCategory[]
  state: ConsentState
  texts: ConsentTexts
  logoUrl?: string
  privacyPolicyUrl?: string
  accentColor?: string
  canDismiss: boolean
  onAcceptAll: () => void
  onRejectAll: () => void
  onSave: () => void
  onDismiss: () => void
  onToggle: (key: string) => void
}

function g(texts: ConsentTexts, key: keyof ConsentTexts): string {
  return texts[key] || D[key] || ''
}

function ip(tpl: string, v: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? '')
}

function renderCat(cat: ResolvedCategory, state: ConsentState): string {
  const on = state[cat.key]
  return ip(categoryHTML, {
    key: cat.key,
    activeClass: on ? 'cm-category-on' : '',
    toggleClass: on ? 'cm-toggle-on' : '',
    emojiHtml: cat.emoji ? `<span class="cm-category-emoji">${cat.emoji}</span>` : '',
    label: cat.label,
    sublabelHtml: cat.sublabel ? ` <span class="cm-category-sublabel">(${cat.sublabel})</span>` : '',
    description: cat.description,
    disabledAttr: cat.locked ? 'disabled' : '',
  })
}

function buildHTML(o: RenderOptions): string {
  const t = o.texts
  const logo = o.logoUrl ? `<img class="cm-logo" src="${o.logoUrl}" alt="">` : ''
  const footer = o.privacyPolicyUrl
    ? `<p class="cm-footer">${g(t,'footerText')} <a href="${o.privacyPolicyUrl}" target="_blank" rel="noopener">${g(t,'privacyPolicyLink')}</a></p>`
    : ''
  const close = o.canDismiss
    ? `<button class="cm-close" data-consent-close><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>`
    : ''

  return `${close}<div class="cm-content"><div data-consent-screen="main"><div class="cm-header">${logo}<h3 class="cm-heading">${g(t,'heading')}</h3><p class="cm-subheading">${g(t,'subheading')}</p></div><div class="cm-desc">${g(t,'description')}</div><div class="cm-actions"><button class="cm-btn cm-btn-primary" data-consent-accept>${g(t,'acceptAll')}</button><div class="cm-actions-row"><button class="cm-btn cm-btn-secondary" data-consent-reject>${g(t,'rejectAll')}</button><button class="cm-btn cm-btn-secondary" data-consent-customize>${g(t,'customize')}</button></div></div></div><div data-consent-screen="details" style="display:none"><div class="cm-header"><h3 class="cm-heading">${g(t,'customizeHeading')}</h3><p class="cm-subheading">${g(t,'customizeSubheading')}</p></div><div class="cm-categories">${o.categories.map(c => renderCat(c, o.state)).join('')}</div><div class="cm-actions"><button class="cm-btn cm-btn-primary" data-consent-save>${g(t,'saveChoices')}</button><button class="cm-btn cm-btn-ghost" data-consent-back>${g(t,'back')}</button></div></div>${footer}</div>`
}

export function createDOM(o: RenderOptions): {
  host: HTMLElement
  showMain: () => void
  showDetails: () => void
  updateToggles: () => void
  destroy: () => void
} {
  const accent = o.accentColor || '#c6ff00'

  const host = document.createElement('div')
  host.id = 'consent-modal-root'
  const sh = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = stylesCSS
  sh.appendChild(style)

  const bk = document.createElement('div')
  bk.className = 'cm-backdrop'
  bk.addEventListener('click', () => { if (o.canDismiss) o.onDismiss() })
  sh.appendChild(bk)

  const ml = document.createElement('div')
  ml.className = 'cm-modal'
  sh.appendChild(ml)

  const cd = document.createElement('div')
  cd.className = 'cm-card'
  cd.style.setProperty('--cm-accent', accent)
  cd.style.setProperty('--cm-accent-bg', accent + '1a')
  cd.innerHTML = buildHTML(o)
  ml.appendChild(cd)

  const $ = (s: string) => sh.querySelector(s) as HTMLElement | null

  $('[data-consent-close]')?.addEventListener('click', o.onDismiss)
  $('[data-consent-accept]')?.addEventListener('click', o.onAcceptAll)
  $('[data-consent-reject]')?.addEventListener('click', o.onRejectAll)
  $('[data-consent-save]')?.addEventListener('click', o.onSave)
  $('[data-consent-customize]')?.addEventListener('click', () => showDetails())
  $('[data-consent-back]')?.addEventListener('click', () => showMain())

  sh.querySelectorAll<HTMLElement>('[data-consent-toggle]').forEach(btn => {
    btn.addEventListener('click', () => o.onToggle(btn.dataset.consentToggle!))
  })

  const mainScreen = $('[data-consent-screen="main"]')!
  const detailsScreen = $('[data-consent-screen="details"]')!

  function showMain() {
    cd.classList.remove('cm-details')
    detailsScreen.style.opacity = '0'
    detailsScreen.style.transform = 'translateX(1rem)'
    setTimeout(() => {
      detailsScreen.style.display = 'none'
      mainScreen.style.display = ''
      mainScreen.style.opacity = '0'
      mainScreen.style.transform = 'translateX(-1rem)'
      requestAnimationFrame(() => {
        mainScreen.style.opacity = '1'
        mainScreen.style.transform = 'none'
      })
    }, 150)
  }

  function showDetails() {
    cd.classList.add('cm-details')
    mainScreen.style.opacity = '0'
    mainScreen.style.transform = 'translateX(-1rem)'
    setTimeout(() => {
      mainScreen.style.display = 'none'
      detailsScreen.style.display = ''
      detailsScreen.style.opacity = '0'
      detailsScreen.style.transform = 'translateX(1rem)'
      requestAnimationFrame(() => {
        detailsScreen.style.opacity = '1'
        detailsScreen.style.transform = 'none'
      })
    }, 150)
  }

  function updateToggles() {
    sh.querySelectorAll<HTMLElement>('[data-consent-toggle]').forEach(btn => {
      const k = btn.dataset.consentToggle!
      const el = sh.querySelector(`[data-consent-cat="${k}"]`)
      if (o.state[k]) {
        btn.classList.add('cm-toggle-on')
        el?.classList.add('cm-category-on')
      } else {
        btn.classList.remove('cm-toggle-on')
        el?.classList.remove('cm-category-on')
      }
    })
  }

  return { host, showMain, showDetails, updateToggles, destroy: () => host.remove() }
}
