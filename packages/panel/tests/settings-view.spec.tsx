import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PanelSettings } from '../src/settings/view.tsx'

describe('PanelSettings', () => {
  it('hides the form when Host exposes no config client', () => {
    const html = renderToStaticMarkup(createElement(PanelSettings, {
      locale: 'en',
      mode: 'production',
    }))
    expect(html).toBe('')
  })
})
