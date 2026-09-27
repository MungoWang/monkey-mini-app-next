import { CredentialError } from './codes.ts'

/** One account an author can recognize. No secret. */
export interface CredentialListing {
  readonly name: string
  readonly description: string
}

/**
 * Read port Host and the author tool call.
 * Writes stay on the source Shell holds. This interface has no `put` or `delete`.
 */
export interface CredentialProvider {
  list(): Promise<readonly CredentialListing[]>
  get(name: string): Promise<string | undefined>
}

/**
 * No source. `list` is empty. `get` is `undefined`.
 * An empty name is still `credential-invalid`.
 */
export function emptyCredentials(): CredentialProvider {
  return {
    list: () => Promise.resolve([]),
    get: name => Promise.resolve().then(() => {
      admitCredentialName(name)
      return undefined
    }),
  }
}

/** Reject an empty name before the source is read. */
export function admitCredentialName(name: string): string {
  if (name === '') throw new CredentialError('credential-invalid', 'credential name is empty')
  return name
}
