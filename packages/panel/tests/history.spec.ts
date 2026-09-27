import { describe, expect, it } from 'vitest'

import type { HistoryClient } from '../src/history/client.ts'
import { historyState, loadCommit, loadHistory, reduceHistory } from '../src/history/state.ts'

const commit = { id: 'abc', message: 'add note', time: '2026-09-17T00:00:00.000Z', parentIds: [] }

describe('history view', () => {
  it('keeps a failed load distinct from an empty history', async () => {
    expect(reduceHistory(historyState(), { type: 'loaded', commits: [] }).failed).toBe(false)
    expect(reduceHistory(historyState(), { type: 'failed' }).failed).toBe(true)
    const named = reduceHistory(historyState(), { type: 'failed', message: 'down' })
    expect(named.error).toBe('down')
    expect(reduceHistory(named, { type: 'failed' }).error).toBeUndefined()
    const detailError = reduceHistory(named, { type: 'detail-failed', message: 'missing' })
    expect(detailError.detailError).toBe('missing')
    expect(reduceHistory(detailError, { type: 'detail', detail: { message: 'add note', time: commit.time, parentIds: [], files: [] } }).detailError).toBeUndefined()
    const selected = reduceHistory(historyState(), { type: 'select', commitId: commit.id })
    expect(selected.selected).toBe(commit.id)
    const detail = reduceHistory(selected, {
      type: 'detail',
      detail: { message: commit.message, time: commit.time, parentIds: [], files: [] },
    })
    expect(detail.detail?.message).toBe('add note')
    expect(reduceHistory(detail, { type: 'detail-failed' }).detailFailed).toBe(true)
    const actions: string[] = []
    await loadHistory(client(), 'com.example.app', action => actions.push(action.type))
    await loadHistory(failing(), 'com.example.app', action => actions.push(action.type))
    expect(actions).toEqual(['loaded', 'failed'])
    const plain: string[] = []
    await loadHistory({ readHistory: () => Promise.reject('down'), readCommit: () => Promise.resolve({ message: '', time: '', parentIds: [], files: [] }) }, 'com.example.app', action => plain.push(action.type))
    expect(plain).toEqual(['failed'])
    await loadCommit({ readHistory: () => Promise.resolve([]), readCommit: () => Promise.reject('missing') }, 'com.example.app', 'abc', action => plain.push(action.type))
    expect(plain).toContain('detail-failed')
    const opened: string[] = []
    await loadCommit(client(), 'com.example.app', commit.id, action => opened.push(action.type))
    expect(opened).toEqual(['select', 'detail'])
  })
})

function client(): HistoryClient {
  return {
    readHistory: () => Promise.resolve([commit]),
    readCommit: () => Promise.resolve({ message: commit.message, time: commit.time, parentIds: [], files: [] }),
  }
}

function failing(): HistoryClient {
  return {
    readHistory: () => Promise.reject(new Error('down')),
    readCommit: () => Promise.reject(new Error('down')),
  }
}
