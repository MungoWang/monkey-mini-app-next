/** @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import type { ThemeClient } from '../src/theme/client.ts'
import { PanelTheme } from '../src/theme/view.tsx'

describe('PanelTheme', () => {
  it('hides without a client and does not offer the app file outside app scope', async () => {
    const hidden = document.createElement('div')
    const hiddenRoot = createRoot(hidden)
    await act(async () => {
      hiddenRoot.render(<PanelTheme locale="en" mode="production" />)
    })
    expect(hidden.innerHTML).toBe('')
    hiddenRoot.unmount()

    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<PanelTheme client={client()} appId="com.example.app" appFile locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(host.textContent).toContain('Ink')
    expect(host.textContent).toContain('missing token')
    expect(host.textContent).toContain('App file')
    const hostOnly = document.createElement('div')
    document.body.append(hostOnly)
    const hostRoot = createRoot(hostOnly)
    await act(async () => {
      hostRoot.render(<PanelTheme client={client()} locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(hostOnly.textContent).not.toContain('App file')
    const parsed = document.createElement('div')
    document.body.append(parsed)
    const parsedRoot = createRoot(parsed)
    await act(async () => {
      parsedRoot.render(<PanelTheme
        client={{ ...client(), appFile: () => Promise.resolve(true) }}
        appId="com.example.app"
        locale="en"
        mode="production"
      />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(parsed.textContent).toContain('App file')
    const pinned = document.createElement('div')
    document.body.append(pinned)
    const pinnedRoot = createRoot(pinned)
    await act(async () => {
      pinnedRoot.render(<PanelTheme
        client={{ ...client(), readPin: () => Promise.resolve({ kind: 'follow-host' }) }}
        appId="com.example.app"
        locale="en"
        mode="production"
      />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    const stored = [...pinned.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Follow host')
    expect(stored?.getAttribute('aria-pressed')).toBe('true')
    pinnedRoot.unmount()
    pinned.remove()
    parsedRoot.unmount()
    parsed.remove()
    const followHost = [...hostOnly.querySelectorAll('button')].find(button => button.textContent === 'Follow host')
    await act(async () => {
      followHost?.click()
    })
    hostRoot.unmount()
    hostOnly.remove()
    const follow = [...host.querySelectorAll('button')].find(button => button.textContent === 'Follow host')
    const clear = [...host.querySelectorAll('button')].find(button => button.textContent === 'Clear')
    const ink = [...host.querySelectorAll('button')].find(button => button.textContent === 'Ink')
    const appFile = [...host.querySelectorAll('button')].find(button => button.textContent === 'App file')
    await act(async () => {
      follow?.click()
      clear?.click()
      ink?.click()
      appFile?.click()
      await Promise.resolve()
    })
    root.unmount()
    host.remove()
    const failed = document.createElement('div')
    document.body.append(failed)
    const failedRoot = createRoot(failed)
    await act(async () => {
      failedRoot.render(<PanelTheme client={{
        listPalettes: () => Promise.reject(new Error('down')),
        setPin: () => Promise.resolve({ kind: 'default' }),
      }} locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(failed.textContent).toContain('down')
    await act(async () => {
      failedRoot.render(<PanelTheme client={{
        listPalettes: () => Promise.reject('down'),
        setPin: () => Promise.resolve({ kind: 'default' }),
      }} locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(failed.textContent).toContain('Theme pin failed to save')
    failedRoot.unmount()
    failed.remove()
  })
})

function client(): ThemeClient {
  return {
    listPalettes: () => Promise.resolve({
      palettes: [{ id: 'ink', name: 'Ink' }],
      ignored: [{ file: 'theme-bad.css', reason: 'missing token' }],
    }),
    setPin: (_appId, pin) => Promise.resolve(pin),
  }
}
