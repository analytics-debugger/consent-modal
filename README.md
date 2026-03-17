# @analytics-debugger/consent-modal

[![npm version](https://img.shields.io/npm/v/@analytics-debugger/consent-modal?color=c6ff00&label=npm)](https://www.npmjs.com/package/@analytics-debugger/consent-modal)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@analytics-debugger/consent-modal?color=c6ff00&label=gzip)](https://bundlephobia.com/package/@analytics-debugger/consent-modal)
[![CI](https://img.shields.io/github/actions/workflow/status/analytics-debugger/consent-modal/ci.yml?branch=main&label=CI)](https://github.com/analytics-debugger/consent-modal/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/@analytics-debugger/consent-modal?color=c6ff00)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-c6ff00)](package.json)

Lightweight, framework-agnostic cookie consent modal with Shadow DOM encapsulation, Google Consent Mode v2 support, i18n, and dark mode. Zero dependencies.

| | Size |
|---|---|
| Raw (ESM) | 16.4 KB |
| Raw (UMD) | 14.9 KB |
| Gzipped | **~5.1 KB** |


<img width="738" height="557" alt="image" src="https://github.com/user-attachments/assets/da654758-a508-4c67-aecd-44f78c48c88b" />
<img width="712" height="658" alt="image" src="https://github.com/user-attachments/assets/220c3b4a-41b6-48a1-8bfd-19ea767a50e1" />

## Features

- **Shadow DOM encapsulation** -- styles are fully isolated; no CSS leaks in or out
- **Google Consent Mode v2** -- fires `consent default` and `consent update` commands automatically
- **i18n** -- built-in locale files (en, es, de, fr) with auto-detection of browser language
- **Dark mode** -- `true`, `false`, or `'auto'` (follows `prefers-color-scheme`)
- **Block navigation** -- prevent users from navigating away before giving consent
- **Configurable categories** -- any number of categories with optional `locked`, `default`, and `emoji` properties
- **Custom accent color** -- single property to theme the modal
- **Cookie persistence** -- stores consent with `created_timestamp` and `updated_timestamp`
- **HTML template partials** -- override individual parts of the modal markup
- **Custom events** -- open the modal or settings panel from anywhere via `window.dispatchEvent`
- **Callbacks** -- `onAcceptAll`, `onRejectAll`, `onSave`, `onChange`
- **ESM + UMD builds** -- works with bundlers, `<script>` tags, jsdelivr, and unpkg
- **Zero dependencies**
- **MIT licensed**

## Installation

```bash
npm install @analytics-debugger/consent-modal
```

Or with other package managers:

```bash
yarn add @analytics-debugger/consent-modal
pnpm add @analytics-debugger/consent-modal
bun add @analytics-debugger/consent-modal
```

## Quick Start

```ts
import { createConsentModal } from '@analytics-debugger/consent-modal'

const modal = createConsentModal({
  categories: [
    { key: 'necessary', label: 'Essential', emoji: '🛡️', description: 'Required for the site to function.', locked: true, default: true },
    { key: 'analytics', label: 'Analytics', emoji: '📊', sublabel: 'Performance', description: 'Helps us understand how the site is used.' },
    { key: 'marketing', label: 'Marketing', emoji: '🎯', sublabel: 'Targeting', description: 'Used for personalized advertising.' },
  ],
  privacyPolicyUrl: '/privacy',
  accentColor: '#c6ff00',
  darkMode: 'auto',
  onAcceptAll: (state) => console.log('Accepted all:', state),
  onChange: (state) => console.log('Consent changed:', state),
})
```

The modal will appear automatically on first visit. Once the user makes a choice, the consent state is persisted in a cookie and the modal will not appear again until the cookie expires.

## Configuration

All options are passed to `createConsentModal(options)`.

### Required

| Option | Type | Description |
|---|---|---|
| `categories` | `ConsentCategory[]` | Array of consent categories to display. |

### Optional

| Option | Type | Default | Description |
|---|---|---|---|
| `cookieName` | `string` | `'cm_consent'` | Name of the cookie used to persist consent. |
| `cookieDays` | `number` | `365` | Cookie expiration in days. |
| `privacyPolicyUrl` | `string` | -- | URL to link in the footer. |
| `logoUrl` | `string` | -- | Path to a logo image displayed in the modal header. |
| `accentColor` | `string` | -- | CSS color applied to buttons and toggles. |
| `darkMode` | `boolean \| 'auto'` | -- | Enable dark mode. `'auto'` follows the user's OS preference. |
| `blockNavigation` | `boolean` | `false` | Prevent navigation (beforeunload + popstate) while the modal is open. |
| `autoShow` | `boolean` | `true` | Automatically show the modal if no consent cookie is found. |
| `locale` | `string` | `'en'` | Active locale key. |
| `locales` | `Record<string, ConsentLocale>` | -- | Locale data keyed by language code. |
| `detectLocale` | `boolean` | `false` | Auto-detect the browser's language and select a matching locale. |
| `texts` | `ConsentTexts` | -- | Override default UI strings (heading, buttons, etc.). |
| `gcmMappings` | `GCMMapping` | See below | Map GCM storage types to your category keys. |
| `onAcceptAll` | `(state) => void` | -- | Called when the user accepts all categories. |
| `onRejectAll` | `(state) => void` | -- | Called when the user rejects non-essential categories. |
| `onSave` | `(state) => void` | -- | Called when the user saves custom choices. |
| `onChange` | `(state) => void` | -- | Called on any consent change (accept, reject, or save). |

### ConsentCategory

```ts
interface ConsentCategory {
  key: string          // Unique identifier (e.g. 'analytics')
  label: string        // Display name
  description: string  // Longer explanation shown in the settings panel
  sublabel?: string    // Secondary label (e.g. 'Performance Cookies')
  emoji?: string       // Emoji displayed next to the label
  locked?: boolean     // If true, the toggle is always on and cannot be disabled
  default?: boolean    // Initial state when no consent cookie exists
}
```

### ConsentTexts

All text strings are optional. Provide only the ones you want to override.

```ts
interface ConsentTexts {
  heading?: string            // Main heading
  subheading?: string         // Subheading below the main heading
  descriptionP1?: string      // First paragraph
  descriptionP2?: string      // Second paragraph
  acceptAll?: string          // Accept all button label
  rejectAll?: string          // Reject all button label
  customize?: string          // "Let me choose" button label
  customizeHeading?: string   // Settings panel heading
  customizeSubheading?: string // Settings panel subheading
  saveChoices?: string        // Save button label
  back?: string               // Back button label
  footerText?: string         // Footer text before privacy link
  privacyPolicyLink?: string  // Privacy policy link text
}
```

## i18n

Built-in locale files are included for `en`, `es`, `de`, and `fr` under the `i18n/` directory. You can also supply your own translations.

```ts
const modal = createConsentModal({
  categories: [/* ... */],
  locale: 'es',
  locales: {
    es: {
      texts: {
        heading: 'Tu privacidad importa',
        acceptAll: 'Aceptar todo',
        rejectAll: 'Rechazar todo',
        customize: 'Personalizar',
        saveChoices: 'Guardar preferencias',
      },
      categories: {
        necessary: { label: 'Esenciales', description: 'Necesarias para el funcionamiento del sitio.' },
        analytics: { label: 'Analítica', sublabel: 'Rendimiento', description: 'Nos ayudan a mejorar el sitio.' },
        marketing: { label: 'Marketing', sublabel: 'Segmentación', description: 'Para publicidad personalizada.' },
      },
    },
  },
})
```

### Auto-detection

Set `detectLocale: true` to automatically select a locale based on the browser's `navigator.language`. The library checks for an exact match first (`pt-BR`), then falls back to the base language (`pt`), and finally defaults to `'en'`.

```ts
createConsentModal({
  categories: [/* ... */],
  detectLocale: true,
  locales: { es: { /* ... */ }, fr: { /* ... */ } },
})
```

### Changing locale at runtime

```ts
modal.setLocale('fr')
modal.show() // Will render in French
```

## Dark Mode

```ts
// Always dark
createConsentModal({ categories: [/* ... */], darkMode: true })

// Always light
createConsentModal({ categories: [/* ... */], darkMode: false })

// Follow OS preference (prefers-color-scheme)
createConsentModal({ categories: [/* ... */], darkMode: 'auto' })
```

## Block Navigation

When `blockNavigation: true`, the modal prevents the user from navigating away (via `beforeunload` and `popstate`) until consent is given. Navigation is restored as soon as the user accepts, rejects, or saves their choices.

```ts
createConsentModal({
  categories: [/* ... */],
  blockNavigation: true,
})
```

## Google Consent Mode v2

The library automatically pushes `consent default` and `consent update` commands to `dataLayer` based on the user's choices. Map each GCM storage type to one of your category keys:

```ts
createConsentModal({
  categories: [
    { key: 'necessary', label: 'Essential', description: '...', locked: true, default: true },
    { key: 'analytics', label: 'Analytics', description: '...' },
    { key: 'marketing', label: 'Marketing', description: '...' },
  ],
  gcmMappings: {
    ad_storage: 'marketing',
    analytics_storage: 'analytics',
    ad_user_data: 'marketing',
    ad_personalization: 'marketing',
    functionality_storage: 'necessary',
    personalization_storage: 'necessary',
    security_storage: 'necessary',
  },
})
```

### Default mappings

If you omit `gcmMappings`, the following defaults are used:

```ts
{
  ad_storage: 'marketing',
  analytics_storage: 'analytics',
  ad_user_data: 'marketing',
  ad_personalization: 'marketing',
}
```

## Custom Templates

The modal UI is built from HTML partials located in `templates/parts/`. The available partials are:

- `header.html` -- logo and close button area
- `description.html` -- heading, subheading, and body text
- `actions-main.html` -- accept all, reject all, and customize buttons
- `category.html` -- individual category toggle row
- `actions-details.html` -- save choices and back buttons
- `footer.html` -- privacy policy link
- `close.html` -- close button icon
- `decoration.html` -- decorative elements

## CDN Usage

Load the UMD build directly from a CDN. No bundler required.

### jsdelivr

```html
<script src="https://cdn.jsdelivr.net/npm/@analytics-debugger/consent-modal/dist/dta-cm.umd.js"></script>
<script>
  var modal = ConsentModal.createConsentModal({
    categories: [
      { key: 'necessary', label: 'Essential', description: 'Required.', locked: true, default: true },
      { key: 'analytics', label: 'Analytics', description: 'Usage data.' },
    ],
    privacyPolicyUrl: '/privacy',
  })
</script>
```

### unpkg

```html
<script src="https://unpkg.com/@analytics-debugger/consent-modal/dist/dta-cm.umd.js"></script>
```

## Google Tag Manager Integration

When using the consent modal with GTM, consent defaults must fire **before** GTM loads. The recommended approach is a two-part setup:

### Step 1: Inline consent defaults (before GTM snippet)

Add this script in the `<head>` **before** your GTM container snippet. This ensures all tags start in a denied state, and any previously saved consent is applied immediately.

```html
<script>
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{
  ad_storage:'denied',
  analytics_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  wait_for_update:500
});
var m=document.cookie.match(/(?:^|; )my_consent=([^;]*)/);
if(m){try{var c=JSON.parse(decodeURIComponent(m[1]));
gtag('consent','update',{
  ad_storage:c.marketing?'granted':'denied',
  analytics_storage:c.analytics?'granted':'denied',
  ad_user_data:c.marketing?'granted':'denied',
  ad_personalization:c.marketing?'granted':'denied'
})}catch(e){}}
</script>
<!-- GTM snippet goes here -->
```

Replace `my_consent` with your `cookieName` value, and adjust the category key mappings (`c.marketing`, `c.analytics`) to match your configuration.

### Step 2: Load the modal via GTM Custom HTML tag

Create a Custom HTML tag in GTM that fires on All Pages with high priority:

```html
<script>
(function(){
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@analytics-debugger/consent-modal/dist/dta-cm.umd.js';
  s.onload = function(){
    ConsentModal.createConsentModal({
      categories: [
        { key: 'necessary', label: 'Essential', emoji: '\ud83d\udee1\ufe0f', description: 'Required for the site to work.', locked: true, default: true },
        { key: 'analytics', label: 'Analytics', emoji: '\ud83d\udcca', description: 'Helps us improve the site.', sublabel: 'Performance' },
        { key: 'marketing', label: 'Marketing', emoji: '\ud83c\udfaf', description: 'Personalized advertising.', sublabel: 'Targeting' }
      ],
      cookieName: 'my_consent',
      privacyPolicyUrl: '/privacy',
      accentColor: '#c6ff00',
      autoShow: true
    });
  };
  document.head.appendChild(s);
})();
</script>
```

The library handles `consent update` calls automatically when the user interacts with the modal. GTM tags configured with consent checks will fire or hold based on the current state.

### How it works

1. Page loads, inline script sets `consent default` to `denied` for all storage types
2. If a saved cookie exists, the inline script immediately fires `consent update` with the saved preferences
3. GTM loads and checks consent state -- tags that require consent will wait
4. The consent modal library loads and shows the modal to first-time visitors
5. When the user makes a choice, the library fires `consent update` and GTM tags respond accordingly

## API Reference

`createConsentModal(options)` returns an instance with the following methods:

### `modal.show()`

Opens the consent modal (main view).

### `modal.showSettings()`

Opens the consent modal directly to the settings/customization panel.

### `modal.hide()`

Closes the modal with a transition animation.

### `modal.getState()`

Returns the current consent state as a plain object.

```ts
modal.getState()
// { necessary: true, analytics: false, marketing: false }
```

### `modal.isGranted(key)`

Returns `true` if the given category is currently granted.

```ts
modal.isGranted('analytics') // false
```

### `modal.setLocale(locale)`

Changes the active locale. If the modal is currently rendered, it will be destroyed and rebuilt on the next `show()` call.

### `modal.getLocale()`

Returns the current locale string.

### `modal.destroy()`

Removes the modal from the DOM and cleans up event listeners.

## Events

You can open the modal from anywhere in your application by dispatching custom events on `window`:

```js
// Open the main consent view
window.dispatchEvent(new Event('consent-modal:open'))

// Open the settings/customization view directly
window.dispatchEvent(new Event('consent-modal:settings'))
```

This is useful for "Manage cookies" links in footers or settings pages:

```html
<a href="#" onclick="window.dispatchEvent(new Event('consent-modal:settings')); return false;">
  Manage cookie preferences
</a>
```

## Cookie Format

The consent cookie is stored as JSON with the following shape:

```json
{
  "necessary": true,
  "analytics": false,
  "marketing": false,
  "created_timestamp": 1710000000000,
  "updated_timestamp": 1710000000000
}
```

The `created_timestamp` is set once on first consent. The `updated_timestamp` is refreshed every time the user changes their preferences.

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Shadow DOM is required -- IE11 is not supported.

## License

MIT -- Copyright (c) 2026 Analytics Debugger S.L.U.
