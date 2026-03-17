export interface CookieOptions {
  domain?: string | 'auto'
  sameSite?: 'Strict' | 'Lax' | 'None'
  secure?: boolean
}

export function getRootDomain(): string | null {
  let domain = document.location.hostname
  if (domain === 'localhost' || domain === '127.0.0.1') return null
  if (domain.startsWith('www.')) {
    domain = domain.substring(4)
  }
  const parts = domain.split('.')
  for (let i = 1; i <= parts.length; i++) {
    const test = parts.slice(i * -1).join('.')
    document.cookie = `_dta_test=1;path=/;domain=${test}`
    if (document.cookie.indexOf('_dta_test') !== -1) {
      document.cookie = `_dta_test=1;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;domain=${test}`
      return test
    }
  }
  return null
}

function resolveDomain(domain?: string | 'auto'): string | null {
  if (!domain || domain === 'auto') return getRootDomain()
  return domain
}

export function setCookie(name: string, value: string, days: number, opts?: CookieOptions): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  const domain = resolveDomain(opts?.domain)
  const domainPart = domain ? `;domain=${domain}` : ''
  const sameSite = opts?.sameSite || 'Lax'
  const securePart = (opts?.secure || sameSite === 'None') ? ';Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/${domainPart};SameSite=${sameSite}${securePart}`
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}
