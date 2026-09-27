import { describe, expect, it } from 'vitest'

import { panelDirectory, windowOverride } from '../src/launch.ts'

describe('launch paths', () => {
  it('keeps the built-in paths when the environment is empty', () => {
    expect(panelDirectory({}, '/panel')).toBe('/panel')
    expect(panelDirectory({ MINI_APP_PANEL: '' }, '/panel')).toBe('/panel')
    expect(windowOverride({})).toBeUndefined()
    expect(windowOverride({ MINI_APP_WINDOW: '' })).toBeUndefined()
  })

  it('uses a panel directory and a window binary when they are set', () => {
    expect(panelDirectory({ MINI_APP_PANEL: '/artifact' }, '/panel')).toBe('/artifact')
    expect(windowOverride({ MINI_APP_WINDOW: '/artifact/mini-app-window' })).toBe('/artifact/mini-app-window')
  })
})
