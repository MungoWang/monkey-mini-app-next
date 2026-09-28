import { StorageError } from './codes.ts'

/** Strip comments and string literals so keyword checks do not match quoted text. */
export function stripSql(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/'(?:''|[^'])*'/g, "''")
}

/** Runtime SQL may read or write rows. It may not change schema or touch host tables. */
export function assertRuntimeSql(sql: string): void {
  const bare = stripSql(sql).trim()
  assertHostTables(bare, 'storage-forbidden')
  if (!/^(select|insert|update|delete|replace|with)\b/i.test(bare)
    || /\b(create|drop|alter|pragma|vacuum|reindex|analyze|attach|detach|begin|commit|rollback|savepoint|release)\b/i.test(bare)
    || /\bload_extension\s*\(/i.test(bare)) {
    throw new StorageError('storage-forbidden', 'statement is not allowed')
  }
}

/** A schema file may change app tables and rewrite app rows. It may not touch host tables or leave the file. */
export function assertMigrationSql(sql: string, name: string): void {
  const bare = stripSql(sql).trim()
  if (bare === '') {
    throw new StorageError('storage-migration', `schema file is empty: ${name}`)
  }
  assertHostTables(bare, 'storage-migration')
  if (/\b(attach|detach|begin|commit|rollback|savepoint|release)\b/i.test(bare)
    || /\bload_extension\s*\(/i.test(bare)
    || /\bvacuum\s+into\b/i.test(bare)) {
    throw new StorageError('storage-migration', `schema file is not allowed: ${name}`)
  }
}

function assertHostTables(bare: string, code: 'storage-forbidden' | 'storage-migration'): void {
  if (/\b(kv|schema_migrations)\b/i.test(bare) || /["`\[](kv|schema_migrations)["`\]]/i.test(bare)) {
    throw new StorageError(code, 'host table is reserved')
  }
}
