import { describe, expect, it } from 'vitest'

import { PanelClientError, type PanelClient } from '../src/gallery/client.ts'
import { loadGallery, loadTrash, galleryState, reduceGallery, viewKind } from '../src/index.ts'

const todo = { id: 'com.example.todo', name: 'Todo', description: 'A list', version: '1', acronym: 'TO' }

describe('panel view', () => {
  it('opens a tab without reloading and keeps unreachable distinct from empty', async () => {
    let state = galleryState('overlay')
    state = reduceGallery(state, { type: 'listed', apps: [todo] })
    state = reduceGallery(state, { type: 'search', query: 'nope' })
    expect(viewKind(state)).toBe('none')
    state = reduceGallery(state, { type: 'search', query: '' })
    expect(viewKind(state)).toBe('ready')
    state = reduceGallery(state, { type: 'open', appId: todo.id, title: todo.name })
    expect(state.tabs.active).toBe(1)
    expect(state.tabs.tabs[1]).toEqual({ kind: 'app', appId: todo.id, title: todo.name })
    state = reduceGallery(state, { type: 'open', appId: todo.id })
    expect(state.tabs.tabs).toHaveLength(2)
    state = reduceGallery(state, { type: 'switch', index: 0 })
    state = reduceGallery(state, { type: 'close', index: 0 })
    expect(state.tabs.tabs[0]?.kind).toBe('gallery')
    state = reduceGallery(state, { type: 'ask-delete', appId: todo.id })
    expect(state.deletePrompt).toBe('confirm')
    state = reduceGallery(state, { type: 'cancel-delete' })
    expect(state.deletePrompt).toBe('idle')
    state = reduceGallery(state, { type: 'ask-delete', appId: todo.id })
    state = reduceGallery(state, { type: 'delete-failed' })
    expect(state.deletePrompt).toBe('failed')
    state = reduceGallery(state, { type: 'deleted', appId: todo.id })
    expect(state.apps).toEqual([])
    expect(state.tabs.tabs.some(tab => tab.kind === 'app')).toBe(false)
    state = reduceGallery(state, { type: 'card', cardStyle: 'stamp' })
    expect(state.cardStyle).toBe('stamp')
    expect(viewKind(reduceGallery(state, { type: 'unreachable' }))).toBe('unreachable')
    expect(viewKind(reduceGallery(galleryState('standalone'), { type: 'list-failed', message: '500' }))).toBe('failed')

    const actions: string[] = []
    await loadGallery(client([todo]), action => actions.push(action.type))
    await loadGallery(failing('unreachable'), action => actions.push(action.type))
    await loadGallery(failing('failed'), action => actions.push(action.type))
    expect(actions).toEqual(['listed', 'unreachable', 'list-failed'])
    const bare: string[] = []
    await loadGallery({
      list: () => Promise.reject(new Error('down')),
      open: () => Promise.resolve(),
      deleteApp: () => Promise.resolve(),
    }, action => bare.push(action.type))
    expect(bare).toEqual(['list-failed'])
    const gone = reduceGallery(galleryState('standalone'), { type: 'deleted', appId: 'missing' })
    expect(gone.tabs.tabs).toHaveLength(1)
    const pending = reduceGallery(galleryState('overlay'), { type: 'ask-delete', appId: todo.id })
    expect(reduceGallery(pending, { type: 'listed', apps: [todo] }).pendingDeleteId).toBe(todo.id)
    expect(reduceGallery(galleryState('standalone'), { type: 'switch', index: 4 }).tabs.active).toBe(0)
    expect(reduceGallery(galleryState('standalone'), { type: 'open', appId: 'com.example.new' }).tabs.tabs[1]).toEqual({ kind: 'app', appId: 'com.example.new' })
    const opened = reduceGallery(galleryState('overlay'), { type: 'open', appId: todo.id, title: 'Todo' })
    expect(opened.tabs.tabs).toHaveLength(2)
    const trashed = reduceGallery(galleryState('standalone'), { type: 'trash', apps: [todo] })
    expect(reduceGallery(trashed, { type: 'undeleted', appId: todo.id }).apps.map(app => app.id)).toEqual([todo.id])
    expect(reduceGallery(trashed, { type: 'frame-error', message: 'missing' }).frameError).toBe('missing')
    const trashActions: string[] = []
    await loadTrash({
      list: () => Promise.resolve([]),
      open: () => Promise.resolve(),
      deleteApp: () => Promise.resolve(),
      listTrash: () => Promise.resolve([todo]),
    }, action => trashActions.push(action.type))
    expect(trashActions).toEqual(['trash'])
    const trashFailed: string[] = []
    await loadTrash({
      list: () => Promise.resolve([]),
      open: () => Promise.resolve(),
      deleteApp: () => Promise.resolve(),
      listTrash: () => Promise.reject(new Error('down')),
    }, action => trashFailed.push(action.type))
    expect(trashFailed).toEqual(['trash-failed'])
  })

  it('orders the list by open count and keeps host order when heat fails', async () => {
    const other = {
      id: 'com.example.notes',
      name: 'Notes',
      description: 'A pad',
      version: '1',
      acronym: 'NO',
      activity: { lastOpenedAt: '2026-09-20T01:00:00.000Z', openCount: 4 },
    }
    const seen: Array<{ type: string; apps?: readonly { id: string }[] }> = []
    await loadGallery({
      list: () => Promise.resolve([todo, other]),
      open: () => Promise.resolve(),
      deleteApp: () => Promise.resolve(),
    }, action => seen.push(action))
    expect(seen[0]?.apps?.map(app => app.id)).toEqual(['com.example.notes', 'com.example.todo'])
    const kept: Array<{ type: string; apps?: readonly { id: string }[] }> = []
    const plain = { id: other.id, name: other.name, description: other.description, version: other.version, acronym: other.acronym }
    await loadGallery({
      list: () => Promise.resolve([todo, plain]),
      open: () => Promise.resolve(),
      deleteApp: () => Promise.resolve(),
    }, action => kept.push(action))
    expect(kept[0]?.apps?.map(app => app.id)).toEqual(['com.example.todo', 'com.example.notes'])
  })
})

function client(apps: readonly [typeof todo]): PanelClient {
  return {
    list: () => Promise.resolve(apps),
    open: () => Promise.resolve(),
    deleteApp: () => Promise.resolve(),
  }
}

function failing(code: 'unreachable' | 'failed'): PanelClient {
  return {
    list: () => Promise.reject(new PanelClientError(code, code)),
    open: () => Promise.resolve(),
    deleteApp: () => Promise.resolve(),
  }
}
