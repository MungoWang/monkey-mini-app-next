/** @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import type { HistoryClient } from '../src/history/client.ts'
import { PanelHistory } from '../src/history/view.tsx'
import { loadCommit } from '../src/history/state.ts'

const commit = { id: 'abc', message: 'add note', time: '2026-09-17T00:00:00.000Z', parentIds: [] }

describe('PanelHistory', () => {
  it('hides without a client and shows a commit preview', async () => {
    const hidden = document.createElement('div')
    const hiddenRoot = createRoot(hidden)
    await act(async () => {
      hiddenRoot.render(<PanelHistory appId="com.example.app" locale="en" mode="production" />)
    })
    expect(hidden.innerHTML).toBe('')
    hiddenRoot.unmount()

    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<PanelHistory client={client()} appId="com.example.app" locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(host.textContent).toContain('abc')
    expect(host.textContent).toContain('add note')
    const button = host.querySelector('button')
    await act(async () => {
      button?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('note.txt')
    root.unmount()
    host.remove()
    const failedHost = document.createElement('div')
    document.body.append(failedHost)
    const failedRoot = createRoot(failedHost)
    await act(async () => {
      failedRoot.render(<PanelHistory client={{
        readHistory: () => Promise.reject(new Error('down')),
        readCommit: () => Promise.reject(new Error('down')),
      }} appId="com.example.app" locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(failedHost.textContent).toContain('down')
    await act(async () => {
      failedRoot.render(<PanelHistory client={{
        readHistory: () => Promise.reject('down'),
        readCommit: () => Promise.reject('down'),
      }} appId="com.example.app" locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(failedHost.textContent).toContain('History failed to load')
    failedRoot.unmount()
    failedHost.remove()

    let closed = 0
    const lines = document.createElement('div')
    document.body.append(lines)
    const linesRoot = createRoot(lines)
    await act(async () => {
      linesRoot.render(<PanelHistory client={{
        readHistory: () => Promise.resolve([{ ...commit, message: '', time: 'not-a-date' }]),
        readCommit: () => Promise.resolve({
          message: '',
          time: 'not-a-date',
          parentIds: [],
          files: [{ path: 'note.txt', add: 2, del: 1, preview: '+add\n-del\n\n same' }],
        }),
      }} appId="com.example.app" locale="en" mode="production" onClose={() => { closed += 1 }} />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    const row = lines.querySelector('[title="abc"]')
    await act(async () => {
      if (row instanceof HTMLButtonElement) row.click()
      await Promise.resolve()
    })
    expect(lines.textContent).toContain('+add')
    expect(lines.textContent).toContain('-del')
    const close = [...lines.querySelectorAll('button')].find(item => item.textContent === 'Close')
    close?.click()
    expect(closed).toBe(1)
    linesRoot.unmount()
    lines.remove()
  })

  it('records a detail failure', async () => {
    const actions: string[] = []
    await loadCommit({
      readHistory: () => Promise.resolve([]),
      readCommit: () => Promise.reject(new Error('missing')),
    }, 'com.example.app', 'abc', action => actions.push(action.type))
    expect(actions).toEqual(['select', 'detail-failed'])
  })
})

function client(): HistoryClient {
  return {
    readHistory: () => Promise.resolve([commit]),
    readCommit: () => Promise.resolve({
      message: commit.message,
      time: commit.time,
      parentIds: [],
      files: [{ path: 'note.txt', add: 1, del: 0, preview: '+one' }],
    }),
  }
}
