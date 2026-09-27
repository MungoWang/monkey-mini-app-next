/** Codes the file tools emit. */

export const fileToolCodes = [
  'path-escape',
  'path-is-directory',
  'file-missing',
  'edit-not-unique',
  'manifest-protected',
  'app-not-registered',
] as const

/** A file-tool failure. Callers match `code`. */
export type FileToolCode = (typeof fileToolCodes)[number]

/** Failure from an authoring file tool. The message is for a person. */
export class FileToolError extends Error {
  readonly code: FileToolCode

  /**
   * @param code - one of {@link fileToolCodes}
   * @param message - human text; not the match key
   */
  constructor(code: FileToolCode, message: string) {
    super(message)
    this.name = 'FileToolError'
    this.code = code
  }
}
