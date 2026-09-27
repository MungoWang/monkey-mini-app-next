/** @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import type { StorageClient } from '../src/storage/client.ts'
import { PanelStorage } from '../src/storage/view.tsx'

describe('PanelStorage', () => {
  it('hides without a client, lists tables, and dismisses a notice', async () => {
    const hidden = document.createElement('div')
    const hiddenRoot = createRoot(hidden)
    await act(async () => {
      hiddenRoot.render(<PanelStorage appId="com.example.app" locale="en" mode="production" />)
    })
    expect(hidden.innerHTML).toBe('')
    hiddenRoot.unmount()

    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<PanelStorage client={client()} appId="com.example.app" locale="en" mode="production" notice="large" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(host.textContent).toContain('kv')
    expect(host.textContent).toContain('large')
    const dismiss = [...host.querySelectorAll('button')].find(button => button.textContent === 'Dismiss')
    await act(async () => {
      dismiss?.click()
    })
    expect(host.textContent).not.toContain('large')
    const table = [...host.querySelectorAll('button')].find(button => button.textContent === 'kv')
    await act(async () => {
      table?.click()
      await Promise.resolve()
    })
    expect(table?.getAttribute('aria-pressed')).toBe('true')
    expect(host.textContent).toContain('kv')
    expect(host.textContent).toContain('a')
    await act(async () => {
      root.render(<PanelStorage client={{
        readStorage: () => Promise.reject(new Error('down')),
        readTable: () => Promise.reject(new Error('bad')),
      }} appId="com.example.app" locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(host.textContent).toContain('down')
    await act(async () => {
      root.render(<PanelStorage client={{
        readStorage: () => Promise.reject('down'),
        readTable: () => Promise.resolve({ rows: [] }),
      }} appId="com.example.app" locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(host.textContent).toContain('Storage failed to load')
    root.unmount()
    host.remove()
  })

  it('shows the exported JSON when raw is selected', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<PanelStorage client={{
        readStorage: () => Promise.resolve({ bytes: 12, tables: ['kv'] }),
        readTable: () => Promise.resolve({ rows: [{ key: 'tasks', value: [{ id: '1', title: 'Write', notes: 'kept-out', done: false }] }] }),
      }} appId="com.example.app" locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    const table = [...host.querySelectorAll('button')].find(button => button.textContent === 'kv')
    await act(async () => {
      table?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('Write')
    expect(host.textContent).not.toContain('kept-out')
    const raw = [...host.querySelectorAll('button')].find(button => button.textContent === 'Raw')
    await act(async () => {
      raw?.click()
    })
    expect(raw?.getAttribute('aria-pressed')).toBe('true')
    expect(host.textContent).toContain('kept-out')
    expect(host.textContent).toContain('"notes"')
    root.unmount()
    host.remove()

    const wide = document.createElement('div')
    document.body.append(wide)
    const wideRoot = createRoot(wide)
    await act(async () => {
      wideRoot.render(<PanelStorage client={{
        readStorage: () => Promise.resolve({ bytes: 2_500_000, tables: ['kv'] }),
        readTable: () => Promise.resolve({ rows: [
          { key: 'n', value: null },
          { key: 'flag', value: true },
          { value: 3 },
          { key: 'tasks', value: [{ title: 'One', done: true, due: 'today', tags: ['a', 1] }] },
        ] }),
      }} appId="com.example.app" locale="en" mode="production" onClose={() => undefined} />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(wide.textContent).toContain('MB')
    const kv = [...wide.querySelectorAll('button')].find(item => item.textContent === 'kv')
    await act(async () => {
      kv?.click()
      await Promise.resolve()
    })
    expect(wide.textContent).toContain('One')
    expect(wide.textContent).toContain('today')
    expect(wide.textContent).toContain('—')
    wideRoot.unmount()
    wide.remove()
  })

  it('asks before restoring storage', async () => {
    let restored = false
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<PanelStorage client={{
        readStorage: () => Promise.resolve({ bytes: 12, tables: ['kv'] }),
        readTable: () => Promise.resolve({ rows: [] }),
        restoreStorage: async () => { restored = true },
      }} appId="com.example.app" locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'Restore storage')?.click()
    })
    expect(host.textContent).toContain('replaces the live database')
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'Cancel')?.click()
    })
    expect(restored).toBe(false)
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'Restore storage')?.click()
    })
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'Restore' && button.className.includes('bg-primary'))?.click()
      await Promise.resolve()
    })
    expect(restored).toBe(true)
    root.unmount()
    host.remove()
  })
})

function client(): StorageClient {
  return {
    readStorage: () => Promise.resolve({ bytes: 12, tables: ['kv'] }),
    readTable: () => Promise.resolve({ rows: [{ key: 'a' }] }),
  }
}
