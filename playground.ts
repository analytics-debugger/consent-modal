import { createConsentModal } from './src/index'

;(async function() {

// ── State ──

let categories = [
  { key: 'necessary', label: 'Essential', sublabel: '', description: 'These keep the site functional. Always on.', emoji: '\uD83D\uDEE1\uFE0F', locked: true, default: true },
  { key: 'analytics', label: 'Usage insights', sublabel: 'Performance Cookies', description: 'Helps us understand how the site is used.', emoji: '\uD83D\uDCCA', locked: false, default: false },
  { key: 'marketing', label: 'Personalization', sublabel: 'Targeting Cookies', description: 'Used for personalized advertising.', emoji: '\uD83C\uDFAF', locked: false, default: false },
]

let modal: any = null
let activeCodeTab = 'code-esm'

// ── Load all i18n JSON files ──

const localeCodes = ['ast','ca','de','en','es','eu','fr','gl','it','ja','ko','ru','zh']
const locales: Record<string, any> = {}
await Promise.all(localeCodes.map(async (code) => {
  const res = await fetch(`./i18n/${code}.json`)
  locales[code] = await res.json()
}))

// ── Helpers ──

const $ = (id: string) => document.getElementById(id)!
const switchState = (btn: Element) => btn.classList.contains('on')

function toggleSwitch(btn: Element) {
  btn.classList.toggle('on')
  btn.setAttribute('aria-checked', String(btn.classList.contains('on')))
}

// ── Event log ──

function logEvent(type: string, data: any) {
  const el = $('event-log')
  const time = new Date().toLocaleTimeString()
  el.textContent = `[${time}] ${type}: ${JSON.stringify(data)}\n` + el.textContent
}

// ── Consent state display ──

function updateState(state: any) {
  $('state-output').textContent = JSON.stringify(state, null, 2)

  const gcmEl = $('gcm-output')
  const mappings: Record<string, string> = {
    ad_storage: ($('gcm-ad_storage') as HTMLInputElement).value,
    analytics_storage: ($('gcm-analytics_storage') as HTMLInputElement).value,
    ad_user_data: ($('gcm-ad_user_data') as HTMLInputElement).value,
    ad_personalization: ($('gcm-ad_personalization') as HTMLInputElement).value,
  }
  gcmEl.innerHTML = Object.entries(mappings).map(([gcmKey, catKey]) => {
    const granted = state[catKey]
    return `<div class="gcm-item"><span class="key">${gcmKey}</span><span class="val ${granted ? 'granted' : 'denied'}">${granted ? 'granted' : 'denied'}</span></div>`
  }).join('')
}

// ── Code generation ──

function generateCode() {
  const cookie = ($('cfg-cookie') as HTMLInputElement).value
  const privacy = ($('cfg-privacy') as HTMLInputElement).value
  const accent = ($('cfg-color') as HTMLInputElement).value
  const logo = ($('cfg-logo') as HTMLInputElement).value
  const darkVal = ($('cfg-darkmode') as HTMLSelectElement).value
  const darkMode = darkVal === 'auto' ? "'auto'" : darkVal
  const locale = ($('cfg-locale') as HTMLSelectElement).value

  const catLines = categories.map(c => {
    const parts = [`key: '${c.key}'`, `label: '${c.label}'`]
    if (c.sublabel) parts.push(`sublabel: '${c.sublabel}'`)
    if (c.emoji) parts.push(`emoji: '${c.emoji}'`)
    parts.push(`description: '${c.description}'`)
    if (c.locked) parts.push('locked: true')
    if (c.default) parts.push('default: true')
    return `    { ${parts.join(', ')} }`
  }).join(',\n')

  const logoLine = logo ? `\n  logoUrl: '${logo}',` : ''
  const localeLine = locale !== 'en' ? `\n  locale: '${locale}',` : ''

  $('code-esm').textContent = `import { createConsentModal } from '@analytics-debugger/consent-modal'

const modal = createConsentModal({
  categories: [
${catLines}
  ],
  cookieName: '${cookie}',
  cookieDays: ${($('cfg-cookiedays') as HTMLInputElement).value},
  privacyPolicyUrl: '${privacy}',
  accentColor: '${accent}',${logoLine}${localeLine}
  darkMode: ${darkMode},
  autoShow: true,
  onChange: (state) => console.log('Consent changed:', state),
})`

  $('code-cdn').textContent = `<script src="https://unpkg.com/@analytics-debugger/consent-modal"><\/script>
<script>
  var modal = ConsentModal.createConsentModal({
    categories: [
${catLines.replace(/^/gm, '  ')}
    ],
    cookieName: '${cookie}',
    cookieDays: ${($('cfg-cookiedays') as HTMLInputElement).value},
    privacyPolicyUrl: '${privacy}',
    accentColor: '${accent}',${logoLine}${localeLine}
    darkMode: ${darkMode},
    autoShow: true,
  })
<\/script>`
}

// ── Build config from UI ──

function getConfig() {
  const darkVal = ($('cfg-darkmode') as HTMLSelectElement).value
  return {
    categories: categories.filter(c => c.key && c.label),
    cookieName: ($('cfg-cookie') as HTMLInputElement).value,
    cookieDays: parseInt(($('cfg-cookiedays') as HTMLInputElement).value) || 365,
    privacyPolicyUrl: ($('cfg-privacy') as HTMLInputElement).value,
    logoUrl: ($('cfg-logo') as HTMLInputElement).value || undefined,
    accentColor: ($('cfg-color') as HTMLInputElement).value,
    autoShow: false,
    darkMode: darkVal === 'auto' ? 'auto' as const : darkVal === 'true',
    blockNavigation: switchState($('cfg-blocknavigation')),
    locale: ($('cfg-locale') as HTMLSelectElement).value,
    detectLocale: switchState($('cfg-detectlocale')),
    locales,
    texts: {
      heading: ($('txt-heading') as HTMLInputElement).value,
      subheading: ($('txt-subheading') as HTMLInputElement).value,
      descriptionP1: ($('txt-p1') as HTMLTextAreaElement).value,
      descriptionP2: ($('txt-p2') as HTMLTextAreaElement).value,
      acceptAll: ($('txt-accept') as HTMLInputElement).value,
      rejectAll: ($('txt-reject') as HTMLInputElement).value,
      customize: ($('txt-customize') as HTMLInputElement).value,
      customizeHeading: ($('txt-customizeHeading') as HTMLInputElement).value,
      customizeSubheading: ($('txt-customizeSubheading') as HTMLInputElement).value,
      saveChoices: ($('txt-saveChoices') as HTMLInputElement).value,
      back: ($('txt-back') as HTMLInputElement).value,
      footerText: ($('txt-footerText') as HTMLInputElement).value,
      privacyPolicyLink: ($('txt-privacyPolicyLink') as HTMLInputElement).value,
    },
    gcmMappings: {
      ad_storage: ($('gcm-ad_storage') as HTMLInputElement).value,
      analytics_storage: ($('gcm-analytics_storage') as HTMLInputElement).value,
      ad_user_data: ($('gcm-ad_user_data') as HTMLInputElement).value,
      ad_personalization: ($('gcm-ad_personalization') as HTMLInputElement).value,
    },
    onChange: (s: any) => { updateState(s); logEvent('onChange', s) },
    onAcceptAll: (s: any) => { updateState(s); logEvent('onAcceptAll', s) },
    onRejectAll: (s: any) => { updateState(s); logEvent('onRejectAll', s) },
    onSave: (s: any) => { updateState(s); logEvent('onSave', s) },
  }
}

function initModal() {
  if (modal) modal.destroy()
  modal = createConsentModal(getConfig())
  updateState(modal.getState())
  generateCode()
}

// ── Category editor ──

function renderCategories() {
  const list = $('categories-list')
  list.innerHTML = ''

  categories.forEach((cat, i) => {
    const card = document.createElement('div')
    card.className = `cat-card${cat.locked ? ' locked' : ''}`
    card.innerHTML = `
      <div class="cat-header">
        <strong>${cat.emoji || ''} ${cat.label || 'New Category'}</strong>
        <div class="cat-actions">
          ${i > 0 ? `<button class="icon-btn" onclick="moveCategory(${i}, -1)" title="Move up">\u2191</button>` : ''}
          ${i < categories.length - 1 ? `<button class="icon-btn" onclick="moveCategory(${i}, 1)" title="Move down">\u2193</button>` : ''}
          ${!cat.locked ? `<button class="icon-btn del" onclick="removeCategory(${i})" title="Remove">\u00D7</button>` : ''}
        </div>
      </div>
      <div class="cat-grid">
        <div class="field">
          <label>Key</label>
          <input type="text" value="${cat.key}" onchange="updateCategory(${i}, 'key', this.value)" ${cat.locked ? 'disabled' : ''}>
        </div>
        <div class="field">
          <label>Emoji</label>
          <input type="text" value="${cat.emoji || ''}" onchange="updateCategory(${i}, 'emoji', this.value)">
        </div>
        <div class="field">
          <label>Label</label>
          <input type="text" value="${cat.label}" onchange="updateCategory(${i}, 'label', this.value)">
        </div>
        <div class="field">
          <label>Sublabel</label>
          <input type="text" value="${cat.sublabel || ''}" onchange="updateCategory(${i}, 'sublabel', this.value)">
        </div>
        <div class="field full">
          <label>Description</label>
          <textarea onchange="updateCategory(${i}, 'description', this.value)">${cat.description}</textarea>
        </div>
      </div>
      ${!cat.locked ? `
      <div class="toggle-field" style="margin-top:.4rem">
        <label>Default on</label>
        <button class="switch ${cat.default ? 'on' : ''}" onclick="updateCategory(${i}, 'default', !categories[${i}].default); renderCategories()" type="button"></button>
      </div>` : ''}
    `
    list.appendChild(card)
  })
}

;(window as any).updateCategory = (i: number, field: string, value: any) => {
  ;(categories[i] as any)[field] = value
  if (field === 'label' || field === 'emoji') renderCategories()
  generateCode()
}

;(window as any).removeCategory = (i: number) => {
  categories.splice(i, 1)
  renderCategories()
  generateCode()
}

;(window as any).moveCategory = (i: number, dir: number) => {
  const j = i + dir
  ;[categories[i], categories[j]] = [categories[j], categories[i]]
  renderCategories()
  generateCode()
}

;(window as any).categories = categories

// ── Event bindings ──

// Add category
$('add-category').addEventListener('click', () => {
  const n = categories.length
  categories.push({
    key: `category_${n}`,
    label: `Category ${n + 1}`,
    sublabel: '',
    description: 'Describe what this category is used for.',
    emoji: '\uD83D\uDD27',
    locked: false,
    default: false,
  })
  renderCategories()
  generateCode()
})

// Color sync
$('cfg-color-picker').addEventListener('input', (e) => { ($('cfg-color') as HTMLInputElement).value = (e.target as HTMLInputElement).value })
$('cfg-color').addEventListener('input', (e) => {
  if (/^#[0-9a-f]{6}$/i.test((e.target as HTMLInputElement).value)) ($('cfg-color-picker') as HTMLInputElement).value = (e.target as HTMLInputElement).value
})

// Toggle switches
document.querySelectorAll('.switch').forEach(btn => {
  btn.addEventListener('click', () => toggleSwitch(btn))
})

// Locale change triggers rebuild
$('cfg-locale').addEventListener('change', () => initModal())

// Toolbar buttons
$('btn-show').addEventListener('click', () => { initModal(); modal.show() })
$('btn-settings').addEventListener('click', () => { initModal(); modal.showSettings() })
$('btn-apply').addEventListener('click', () => initModal())
$('btn-reset').addEventListener('click', () => {
  const name = ($('cfg-cookie') as HTMLInputElement).value
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`
  location.reload()
})

// Code tabs
document.querySelectorAll('.tab[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab[data-tab]').forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
    const target = (tab as HTMLElement).dataset.tab!
    $('code-esm').style.display = target === 'code-esm' ? '' : 'none'
    $('code-cdn').style.display = target === 'code-cdn' ? '' : 'none'
    activeCodeTab = target
  })
})

// Copy code
$('copy-code').addEventListener('click', () => {
  const text = $(activeCodeTab).textContent!
  navigator.clipboard.writeText(text).then(() => {
    const btn = $('copy-code')
    btn.textContent = 'Copied!'
    setTimeout(() => { btn.textContent = 'Copy' }, 1500)
  })
})

// ── Init ──
renderCategories()
initModal()
})()
