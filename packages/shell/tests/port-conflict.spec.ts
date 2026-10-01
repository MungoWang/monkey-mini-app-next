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

  it('serves the confirm page and quits over HTTP', async () => {
    let origin = ''
    let page = ''
    const decision = resolvePortConflict({
      busyPort: 19011,
      suggestedPort: 19012,
      openWindow: false,
      onReady: async (value) => {
        origin = value
        page = await (await fetch(value)).text()
        const missing = await fetch(`${value}/nope`, { method: 'POST' })
        expect(missing.status).toBe(404)
        await fetch(`${value}/quit`, { method: 'POST' })
      },
    })
    await expect(decision).resolves.toEqual({ kind: 'quit' })
    expect(origin.startsWith('http://127.0.0.1:')).toBe(true)
    expect(page).toContain('Port in use')
    expect(page).toContain('19011')
    expect(page).toContain('19012')
  })

  it('allocates a suggested port when the caller has none', async () => {
    const decision = await resolvePortConflict({
      busyPort: 19021,
      suggestedPort: 0,
      openWindow: false,
      onReady: (value) => {
        void fetch(`${value}/accept`, { method: 'POST' })
      },
    })
    expect(decision.kind).toBe('accept')
    if (decision.kind === 'accept') expect(decision.port).toBeGreaterThanOrEqual(19022)
  })

  it('opens the panel window and kills it once the decision lands', async () => {
    const launched: { command: string; args: readonly string[] }[] = []
    const killed: string[] = []
    const decision = resolvePortConflict({
      busyPort: 19031,
      suggestedPort: 19032,
      mode: 'prompt',
      windowBinary: '/opt/mini-app-window',
      windowSpawn: (command, args) => {
        launched.push({ command, args })
        return { kill: () => killed.push(command) } as never
      },
      onReady: (value) => {
        void fetch(`${value}/accept`, { method: 'POST' })
      },
    })
    await expect(decision).resolves.toEqual({ kind: 'accept', port: 19032 })
    expect(launched).toHaveLength(1)
    expect(launched[0]?.command).toBe('/opt/mini-app-window')
    expect(launched[0]?.args[0]).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
    expect(killed).toEqual(['/opt/mini-app-window'])
  })
})
