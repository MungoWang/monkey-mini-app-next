import { describe, expect, it } from 'vitest'

import { appFrameSandbox } from '../src/frame.ts'

describe('app frame sandbox', () => {
  it('runs the app and refuses top navigation', () => {
    const tokens = appFrameSandbox.split(' ')
    expect(tokens).toContain('allow-scripts')
    expect(tokens).toContain('allow-same-origin')
    expect(tokens).toContain('allow-popups-to-escape-sandbox')
    expect(tokens.some(token => token.startsWith('allow-top-navigation'))).toBe(false)
  })
})
