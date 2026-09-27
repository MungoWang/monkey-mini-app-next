import path from 'node:path'

/**
 * On-disk names for one app's storage. Product code asks this module for a path.
 * Do not spell the directory or the database file anywhere else.
 */
export const storageLayout = {
  dir: 'storage',
  database: 'app.sqlite',
  backup: 'backup.sqlite',
  backupMeta: 'backup.json',
  blocked: 'blocked.json',
  quarantineSuffix: '.quarantine',
} as const

/** The storage directory. Listing and history skip this name. */
export function storageDir(appDir: string): string {
  return path.join(appDir, storageLayout.dir)
}

/** The live database file. */
export function storageDatabase(appDir: string): string {
  return path.join(storageDir(appDir), storageLayout.database)
}

/** The one pre-migration snapshot. */
export function storageBackup(appDir: string): string {
  return path.join(storageDir(appDir), storageLayout.backup)
}

/** Metadata for {@link storageBackup}. */
export function storageBackupMeta(appDir: string): string {
  return path.join(storageDir(appDir), storageLayout.backupMeta)
}

/** Checksums a restore must not apply again. */
export function storageBlocked(appDir: string): string {
  return path.join(storageDir(appDir), storageLayout.blocked)
}

/** Marker left beside a quarantined database. A later open does not replace the file. */
export function storageQuarantine(appDir: string): string {
  return `${storageDatabase(appDir)}${storageLayout.quarantineSuffix}`
}
