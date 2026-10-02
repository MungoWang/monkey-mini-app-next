import { describe, expect, it } from 'vitest'

import { isCredential, looksLikeCredential, maskCredential, mayHoldCredential, namesCredential } from '../src/secrets.ts'

describe('credential detection', () => {
  it('reads a whole name segment, not a substring', () => {
    for (const name of ['GITHUB_TOKEN', 'x-api-key', 'apiKey', 'DB_PASSWORD', 'MY_SECRET', 'authorization', 'SESSION_ID', 'CLIENT_CREDENTIALS']) {
      expect(namesCredential(name), name).toBe(true)
    }
    for (const name of ['NODE_ENV', 'MONKEY', 'AUTHOR', 'MY_KEYSTORE', 'LOG_LEVEL', 'PATH']) {
      expect(namesCredential(name), name).toBe(false)
    }
  })

  it('reads a value shape', () => {
    for (const value of ['Bearer abcdefgh', 'sk-live-123', 'ghp_abcdef', 'eyJhbGciOiJIUzI1NiJ9', '-----BEGIN RSA PRIVATE KEY-----', '0123456789abcdef0123456789abcdef01234567']) {
      expect(looksLikeCredential(value), value).toBe(true)
    }
    for (const value of ['production', 'application/json', 'debug', 'abc', '550e8400-e29b-41d4-a716-446655440000', '0123456789abcdef0123456789abcde']) {
      expect(looksLikeCredential(value), value).toBe(false)
    }
  })

  it('takes either signal, and keeps the ambient test broad', () => {
    expect(isCredential('NODE_ENV', 'production')).toBe(false)
    expect(isCredential('NODE_ENV', 'Bearer abcdefgh')).toBe(true)
    expect(isCredential('GITHUB_TOKEN', 'production')).toBe(true)
    // The ambient test is broad on purpose: MONKEY contains KEY, and withholding it costs nothing.
    expect(mayHoldCredential('MONKEY')).toBe(true)
    expect(mayHoldCredential('PATH')).toBe(false)
  })

  it('keeps the label that names the kind of credential', () => {
    // The scheme or issuer prefix is not secret, and it is what tells a caller what it is looking at.
    expect(maskCredential('Bearer abcdefgh')).toBe('Bearer ab*****gh')
    expect(maskCredential('ghp_1234567890')).toBe('ghp_12*****90')
    expect(maskCredential('sk-live-123')).toBe('sk-li*****23')
    expect(maskCredential('eyJhbGciOiJIUzI1NiJ9')).toBe('eyJhb*****J9')
    expect(maskCredential('-----BEGIN RSA PRIVATE KEY-----')).toBe('-----BEGIN RSA PRIVATE KEY-----')
    // A label with a short body still hides all of it, and a bodyless value is left alone.
    expect(maskCredential('Bearer abc')).toBe('Bearer *****')
    expect(maskCredential('Bearer ')).toBe('Bearer ')
    // No label: the whole value is the secret.
    expect(maskCredential('0123456789abcdef0123456789abcdef01234567')).toBe('01*****67')
    expect(maskCredential('abc')).toBe('*****')
    expect(maskCredential('')).toBe('')
  })
})
