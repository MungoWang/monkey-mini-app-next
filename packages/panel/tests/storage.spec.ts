import { describe, expect, it } from 'vitest'

import type { StorageClient } from '../src/storage/client.ts'
import { loadStorage, loadTable, reduceStorage, storageState } from '../src/storage/state.ts'

describe('storage view', () => {
  it('keeps a failed read distinct from an empty database and can dismiss a notice', async () => {
    expect(reduceStorage(storageState(), { type: 'dismiss-notice' }).noticeDismissed).toBe(true)
    expect(reduceStorage(storageState(), { type: 'failed' }).failed).toBe(true)
    const named = reduceStorage(storageState(), { type: 'failed', message: 'down' })
    expect(named.error).toBe('down')
    expect(reduceStorage(named, { type: 'failed' }).error).toBeUndefined()
    const table = reduceStorage(named, { type: 'table-failed', message: 'bad' })
    expect(table.tableError).toBe('bad')
    expect(reduceStorage(table, { type: 'table', rows: { rows: [] } }).tableError).toBeUndefined()
    const loaded = reduceStorage(storageState(), { type: 'loaded', summary: { bytes: 12, tables: ['kv'] } })
    expect(loaded.summary?.tables).toEqual(['kv'])
    const actions: string[] = []
    await loadStorage(client(), 'com.example.app', action => actions.push(action.type))
    await loadStorage(failing(), 'com.example.app', action => actions.push(action.type))
    await loadTable(client(), 'com.example.app', 'kv', action => actions.push(action.type))
    await loadTable(failing(), 'com.example.app', 'kv', action => actions.push(action.type))
    expect(actions).toEqual(['loaded', 'failed', 'select', 'table', 'select', 'table-failed'])
    const plain: string[] = []
    await loadStorage({ readStorage: () => Promise.reject('down'), readTable: () => Promise.resolve({ rows: [] }) }, 'com.example.app', action => plain.push(action.type))
    await loadTable({ readStorage: () => Promise.resolve({ bytes: 0, tables: [] }), readTable: () => Promise.reject('bad') }, 'com.example.app', 'kv', action => plain.push(action.type))
    expect(plain).toEqual(['failed', 'select', 'table-failed'])
  })
})

function client(): StorageClient {
  return {
    readStorage: () => Promise.resolve({ bytes: 12, tables: ['kv'] }),
    readTable: () => Promise.resolve({ rows: [{ key: 'a' }] }),
  }
}

function failing(): StorageClient {
  return {
    readStorage: () => Promise.reject(new Error('corrupt')),
    readTable: () => Promise.reject(new Error('corrupt')),
  }
}
