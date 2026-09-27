import { existsSync, mkdirSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'

import { StorageError, openStorage, storageDatabase, storageDir } from '../src/index.ts'

const notes = 'CREATE TABLE notes (id INTEGER PRIMARY KEY, label TEXT)'

async function open(schema?: string) {
  const dir = mkdtempSync(join(tmpdir(), 'mma-storage-'))
  if (schema !== undefined) {
    mkdirSync(join(dir, 'schema'))
    writeFileSync(join(dir, 'schema', '001_init.sql'), schema)
  }
  const file = await openStorage(dir)
  return { dir, file, storage: file.connect() }
}

describe('openStorage', () => {
  it('stores json on kv and keeps sql tables apart', async () => {
    const { file, storage } = await open(notes)
    expect(await storage.kv().get('missing')).toBeNull()
    await storage.kv().set('count', { n: 1 })
    expect(await storage.kv().get('count')).toEqual({ n: 1 })
    await storage.kv().delete('count')
    expect(await storage.kv().get('count')).toBeNull()
    await storage.run('INSERT INTO notes (label) VALUES (?)', ['a'])
    await storage.kv().set('count', 1)
    await storage.kv().clear()
    expect(await storage.kv().get('count')).toBeNull()
    expect(await storage.query('SELECT label FROM notes')).toEqual([{ label: 'a' }])
    file.close()
  })

  it('rejects a non-json value, reserved sql, and the wrong statement kind', async () => {
    const { file, storage } = await open()
    await expect(storage.kv().set('bad', () => undefined)).rejects.toMatchObject({ code: 'storage-not-json' })
    await expect(storage.query('SELECT * FROM kv')).rejects.toMatchObject({ code: 'storage-forbidden' })
    await expect(storage.run("ATTACH DATABASE 'other.sqlite' AS other")).rejects.toMatchObject({ code: 'storage-forbidden' })
    await expect(storage.run('CREATE TABLE t (id INTEGER)')).rejects.toMatchObject({ code: 'storage-forbidden' })
    await expect(storage.run('SELECT 1')).rejects.toMatchObject({ code: 'storage-statement' })
    await expect(storage.query('SELECT 1; SELECT 2')).rejects.toMatchObject({ code: 'storage-forbidden' })
    await expect(storage.query('SELECT nope')).rejects.toMatchObject({ code: 'storage-sql' })
    expect(await storage.query("SELECT 'kv' AS label")).toEqual([{ label: 'kv' }])
    file.close()
  })

  it('commits and rolls back a transaction, and rejects the outer handle inside it', async () => {
    const { file, storage } = await open(notes)
    const id = await storage.transaction(async (tx) => {
      const info = await tx.run('INSERT INTO notes (label) VALUES (?)', ['kept'])
      await tx.kv().set('flag', true)
      return info.lastInsertRowid
    })
    expect(id).toBe(1)
    expect(await storage.kv().get('flag')).toBe(true)
    await expect(storage.transaction(async (tx) => {
      await tx.run('INSERT INTO notes (label) VALUES (?)', ['lost'])
      await tx.kv().set('flag', false)
      throw new Error('stop')
    })).rejects.toThrow('stop')
    expect(await storage.query('SELECT label FROM notes')).toEqual([{ label: 'kept' }])
    expect(await storage.kv().get('flag')).toBe(true)
    await expect(storage.transaction(async () => {
      await storage.query('SELECT 1')
    })).rejects.toMatchObject({ code: 'storage-forbidden' })
    file.close()
  })

  it('quarantines a corrupt file and does not create a replacement', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'mma-storage-'))
    const file = storageDatabase(dir)
    mkdirSync(storageDir(dir))
    writeFileSync(file, 'not a database')
    await expect(openStorage(dir)).rejects.toBeInstanceOf(StorageError)
    expect(existsSync(file)).toBe(false)
    expect(existsSync(`${file}.quarantine`)).toBe(true)
    expect(readdirSync(storageDir(dir)).some(name => name.includes('corrupt'))).toBe(true)
    await expect(openStorage(dir)).rejects.toBeInstanceOf(StorageError)
    expect(existsSync(file)).toBe(false)
  })

  it('quarantines a wal sidecar with the corrupt file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'mma-storage-'))
    const file = storageDatabase(dir)
    mkdirSync(storageDir(dir))
    writeFileSync(file, 'not a database')
    writeFileSync(`${file}-wal`, '')
    await expect(openStorage(dir)).rejects.toBeInstanceOf(StorageError)
    expect(existsSync(`${file}-wal`)).toBe(false)
    expect(readdirSync(storageDir(dir)).some(name => name.includes('corrupt') && name.endsWith('-wal'))).toBe(true)
  })

  it('honours an injected row cap and an aborted signal', async () => {
    const { file, storage } = await open('CREATE TABLE nums (n INTEGER)')
    await storage.run('INSERT INTO nums (n) VALUES (1), (2)')
    const capped = file.connect({ maxRows: 1 })
    await expect(capped.query('SELECT n FROM nums')).rejects.toMatchObject({ code: 'storage-too-large' })
    const controller = new AbortController()
    controller.abort()
    const cancelled = file.connect({ signal: controller.signal })
    await expect(cancelled.query('SELECT 1')).rejects.toMatchObject({ code: 'cancelled' })
    file.close()
  })

  it('binds named parameters and blobs, and rolls a nested transaction back', async () => {
    const { file, storage } = await open('CREATE TABLE files (id INTEGER PRIMARY KEY, body BLOB)')
    expect(await storage.query('SELECT @n AS n', { n: 4 })).toEqual([{ n: 4 }])
    const blob = new Uint8Array([1, 2, 3])
    await storage.run('INSERT INTO files (body) VALUES (?)', [blob])
    const rows = await storage.query('SELECT body FROM files')
    expect(Buffer.from(rows[0]?.body as Uint8Array)).toEqual(Buffer.from(blob))
    await expect(storage.transaction(async (tx) => {
      await tx.transaction(async (inner) => {
        await inner.kv().set('a', 1)
        throw new Error('inner')
      })
    })).rejects.toThrow('inner')
    expect(await storage.kv().get('a')).toBeNull()
    const box: { self?: unknown } = {}
    box.self = box
    await expect(storage.kv().set('bad', box)).rejects.toMatchObject({ code: 'storage-not-json' })
    await expect(storage.query('SELECT * FROM "kv"')).rejects.toMatchObject({ code: 'storage-forbidden' })
    await expect(storage.run('BEGIN')).rejects.toMatchObject({ code: 'storage-forbidden' })
    file.close()
  })

  it('opens in wal mode, owner-only, and rejects a foreign schema stamp', async () => {
    const { dir, file } = await open()
    if (process.platform !== 'win32') {
      expect(statSync(storageDatabase(dir)).mode & 0o777).toBe(0o600)
      expect(statSync(storageDir(dir)).mode & 0o777).toBe(0o700)
    }
    file.close()
    const raw = new Database(storageDatabase(dir))
    expect(raw.pragma('journal_mode', { simple: true })).toBe('wal')
    raw.pragma('user_version = 99')
    raw.close()
    await expect(openStorage(dir)).rejects.toMatchObject({ code: 'storage-version' })
    expect(existsSync(storageDatabase(dir))).toBe(true)
  })
})
