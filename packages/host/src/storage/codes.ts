/** Codes the storage engine emits. */

export const storageCodes = [
  'storage-not-json',
  'storage-corrupt',
  'storage-forbidden',
  'storage-sql',
  'storage-statement',
  'storage-too-large',
  'storage-version',
  'storage-backup-too-large',
  'storage-migration',
  'cancelled',
] as const

/** A storage failure. Callers match `code`. */
export type StorageCode = (typeof storageCodes)[number]

/** Failure from the storage engine. The message is for a person. */
export class StorageError extends Error {
  readonly code: StorageCode

  /**
   * @param code - one of {@link storageCodes}
   * @param message - human text; not the match key
   * @param options - optional `cause`
   */
  constructor(code: StorageCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'StorageError'
    this.code = code
  }
}
