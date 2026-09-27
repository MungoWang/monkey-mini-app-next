import { describe, expect, it } from 'vitest'

import { injectPanelPaint } from '../src/http/owner.ts'

describe('injectPanelPaint', () => {
  const html = '<html><head></head><body></body></html>'

  it('bakes a fixed mode and leaves system to the document script', () => {
    const dark = injectPanelPaint(html, { style: '--background:#fff', appearance: 'dark' })
    expect(dark).toContain('data-mode="dark"')
    expect(dark).toContain('--background:#fff')
    const system = injectPanelPaint(html, { style: '--background:#fff', appearance: 'system' })
    expect(system.startsWith('<html>')).toBe(true)
    expect(system).toContain('prefers-color-scheme')
  })
})
