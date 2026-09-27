import { describe, expect, it } from 'vitest'

import { StorageError } from '../src/index.ts'
import { assertMigrationSql, assertRuntimeSql } from '../src/storage/sql.ts'

describe('sql guards', () => {
  it('rejects an empty migration and a runtime pragma', () => {
    expect(() => { assertMigrationSql('   ', '001_init.sql') }).toThrow(StorageError)
    expect(() => { assertMigrationSql('ATTACH DATABASE x', '001_init.sql') }).toThrow(StorageError)
    expect(() => { assertRuntimeSql('PRAGMA journal_mode') }).toThrow(StorageError)
    expect(() => { assertRuntimeSql('SELECT 1') }).not.toThrow()
  })
})
