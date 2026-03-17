export interface ConsentCategory {
  key: string
  label: string
  sublabel?: string
  description: string
  emoji?: string
  locked?: boolean
  default?: boolean
}

export interface ConsentState {
  [key: string]: boolean
}

export interface ConsentTexts {
  heading?: string
  subheading?: string
  descriptionP1?: string
  descriptionP2?: string
  acceptAll?: string
  rejectAll?: string
  customize?: string
  customizeHeading?: string
  customizeSubheading?: string
  saveChoices?: string
  back?: string
  footerText?: string
  privacyPolicyLink?: string
}

export interface ConsentCategoryTranslation {
  label: string
  sublabel?: string
  description: string
}

export interface ConsentLocale {
  texts?: ConsentTexts
  categories?: Record<string, ConsentCategoryTranslation>
}

export interface GCMMapping {
  ad_storage?: string
  analytics_storage?: string
  ad_user_data?: string
  ad_personalization?: string
  functionality_storage?: string
  personalization_storage?: string
  security_storage?: string
}

export interface ConsentModalOptions {
  categories: ConsentCategory[]
  cookieName?: string
  cookieDays?: number
  cookieDomain?: string | 'auto'
  cookieSameSite?: 'Strict' | 'Lax' | 'None'
  cookieSecure?: boolean
  privacyPolicyUrl?: string
  logoUrl?: string
  texts?: ConsentTexts
  locale?: string
  locales?: Record<string, ConsentLocale>
  detectLocale?: boolean
  gcmMappings?: GCMMapping
  accentColor?: string
  darkMode?: boolean | 'auto'
  blockNavigation?: boolean
  onAcceptAll?: (state: ConsentState) => void
  onRejectAll?: (state: ConsentState) => void
  onSave?: (state: ConsentState) => void
  onChange?: (state: ConsentState) => void
  autoShow?: boolean
}
