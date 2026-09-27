import { describe, expect, it } from 'vitest'

import { resolvePortConflict } from '../src/port-conflict.ts'

describe('resolvePortConflict', () => {
  it('auto-accepts and auto-quits without opening a window', async () => {
    await expect(resolvePortConflict({
      busyPort: 9743,
      suggestedPort: 9744,
      mode: 'accept',
      openWindow: false,
    })).resolves.toEqual({ kind: 'accept', port: 9744 })
    await expect(resolvePortConflict({
      busyPort: 9743,
      suggestedPort: 9744,
      mode: 'quit',
      openWindow: false,
    })).resolves.toEqual({ kind: 'quit' })
  })

  it('serves a confirm page and accepts over HTTP', async () => {
    let origin = ''
    const decision = resolvePortConflict({
      busyPort: 19001,
      suggestedPort: 19002,
      mode: 'prompt',
      openWindow: false,
      locale: 'zh-CN',
      onReady: (value) => {
        origin = value
        void fetch(`${value}/accept`, { method: 'POST' })
      },
    })
    await expect(decision).resolves.toEqual({ kind: 'accept', port: 19002 })
    expect(origin.startsWith('http://127.0.0.1:')).toBe(true)
  })
})
