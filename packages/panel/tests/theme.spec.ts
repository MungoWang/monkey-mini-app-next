import { describe, expect, it } from 'vitest'

import type { ThemeClient } from '../src/theme/client.ts'
import { loadPalettes, reduceTheme, savePin, themeState } from '../src/theme/state.ts'

describe('theme picker', () => {
  it('leaves the previous pin when a save fails', async () => {
    const loaded = reduceTheme(themeState(), {
      type: 'loaded',
      palettes: [{ id: 'ink', name: 'Ink' }],
      ignored: [{ file: 'theme-bad.css', reason: 'missing token' }],
    })
    expect(loaded.palettes).toHaveLength(1)
    const saved = reduceTheme(loaded, { type: 'saved', pin: { kind: 'palette', id: 'ink' } })
    expect(saved.pin).toEqual({ kind: 'palette', id: 'ink' })
    expect(reduceTheme(saved, { type: 'save-failed' }).pin).toEqual(saved.pin)
    expect(reduceTheme(themeState(), { type: 'failed' }).failed).toBe(true)
    const named = reduceTheme(themeState(), { type: 'failed', message: 'down' })
    expect(named.error).toBe('down')
    expect(reduceTheme(named, { type: 'loaded', palettes: [], ignored: [] }).error).toBeUndefined()
    expect(reduceTheme(named, { type: 'save-failed', message: 'nope' }).error).toBe('nope')
    expect(reduceTheme(named, { type: 'pin', pin: { kind: 'default' } }).error).toBeUndefined()
    const actions: string[] = []
    await loadPalettes(client(), action => actions.push(action.type))
    await savePin(failing(), 'com.example.app', { kind: 'follow-host' }, action => actions.push(action.type))
    expect(actions).toEqual(['loaded', 'save-failed'])
    const again: string[] = []
    await loadPalettes(failing(), action => again.push(action.type))
    await savePin(client(), 'com.example.app', { kind: 'default' }, action => again.push(action.type))
    expect(again).toEqual(['failed', 'saved'])
    const plain: string[] = []
    await loadPalettes({ listPalettes: () => Promise.reject('down'), setPin: () => Promise.resolve({ kind: 'default' }) }, action => plain.push(action.type))
    await savePin({ listPalettes: () => Promise.resolve({ palettes: [], ignored: [] }), setPin: () => Promise.reject('nope') }, 'com.example.app', { kind: 'default' }, action => plain.push(action.type))
    expect(plain).toEqual(['failed', 'save-failed'])
  })
})

function client(): ThemeClient {
  return {
    listPalettes: () => Promise.resolve({ palettes: [], ignored: [] }),
    setPin: (_appId, pin) => Promise.resolve(pin),
  }
}

function failing(): ThemeClient {
  return {
    listPalettes: () => Promise.reject(new Error('down')),
    setPin: () => Promise.reject(new Error('down')),
  }
}
