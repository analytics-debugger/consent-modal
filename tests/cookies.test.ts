import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCookie, setCookie, getRootDomain } from '../src/cookies'

describe('getCookie', () => {
  beforeEach(() => {
    // Clear all cookies
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0]!.trim()
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`
      }
    })
  })

  it('returns null when cookie does not exist', () => {
    expect(getCookie('nonexistent')).toBeNull()
  })

  it('returns the decoded value of an existing cookie', () => {
    document.cookie = 'test_cookie=hello%20world;path=/'
    expect(getCookie('test_cookie')).toBe('hello world')
  })

  it('returns the correct cookie when multiple cookies exist', () => {
    document.cookie = 'a=1;path=/'
    document.cookie = 'b=2;path=/'
    document.cookie = 'c=3;path=/'
    expect(getCookie('b')).toBe('2')
  })
})

describe('setCookie', () => {
  beforeEach(() => {
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0]!.trim()
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`
      }
    })
  })

  it('sets a cookie that can be read back', () => {
    setCookie('my_cookie', 'my_value', 30)
    expect(getCookie('my_cookie')).toBe('my_value')
  })

  it('encodes special characters in value', () => {
    setCookie('encoded', 'a=b&c=d', 30)
    expect(getCookie('encoded')).toBe('a=b&c=d')
  })
})

describe('getRootDomain', () => {
  it('returns null for localhost', () => {
    // happy-dom defaults to localhost
    expect(getRootDomain()).toBeNull()
  })
})
