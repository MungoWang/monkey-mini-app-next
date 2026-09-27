import { describe, expect, it } from 'vitest'

import { panelLocales, panelText } from '../src/index.ts'

describe('panelText', () => {
  it('returns both locales and fails a missing key only in development', () => {
    expect(panelText('en', 'gallery-empty', 'development')).toBe('No apps yet')
    expect(panelText('zh-CN', 'gallery-empty', 'development')).toBe('还没有应用')
    expect(panelText('en', 'missing', 'production')).toBe('missing')
    expect(() => panelText('en', 'missing', 'development')).toThrow('missing panel label: missing')
    expect(() => panelText('fr', 'gallery-empty', 'production')).toThrow('panel locale is not supported: fr')
    expect(panelLocales).toEqual(['en', 'zh-CN'])
  })
})
