import type { StorageClient, StorageSummary, StorageTable } from './client.ts'

export interface StorageState {
  readonly summary?: StorageSummary
  readonly failed: boolean
  readonly table?: string
  readonly rows?: StorageTable
  readonly tableFailed: boolean
  readonly noticeDismissed: boolean
  readonly error?: string
  readonly tableError?: string
}

export type StorageAction =
  | { readonly type: 'loaded'; readonly summary: StorageSummary }
  | { readonly type: 'failed'; readonly message?: string }
  | { readonly type: 'select'; readonly table: string }
  | { readonly type: 'table'; readonly rows: StorageTable }
  | { readonly type: 'table-failed'; readonly message?: string }
  | { readonly type: 'dismiss-notice' }

/** Empty browse before the load. */
export function storageState(): StorageState {
  return { failed: false, tableFailed: false, noticeDismissed: false }
}

/**
 * Storage browse transition. Read-only. A size notice does not block the app.
 * @param state - current browse
 * @param action - one client result
 */
export function reduceStorage(state: StorageState, action: StorageAction): StorageState {
  switch (action.type) {
    case 'loaded':
      return { ...state, summary: action.summary, failed: false }
    case 'failed':
      return { ...omitTableError(omitError(state)), failed: true, ...action.message ? { error: action.message } : {} }
    case 'select':
      return { ...state, table: action.table, tableFailed: false }
    case 'table':
      return { ...omitTableError(state), rows: action.rows, tableFailed: false }
    case 'table-failed':
      return { ...omitTableError(state), tableFailed: true, ...action.message ? { tableError: action.message } : {} }
    case 'dismiss-notice':
      return { ...state, noticeDismissed: true }
    default:
      return action satisfies never
  }
}

/** Load the file size and table names. A thrown error is not an empty database. */
export async function loadStorage(
  client: StorageClient,
  appId: string,
  dispatch: (action: StorageAction) => void,
): Promise<void> {
  try {
    dispatch({ type: 'loaded', summary: await client.readStorage(appId) })
  } catch (error) {
    dispatch({ type: 'failed', ...thrown(error) })
  }
}

/** Export one table. */
export async function loadTable(
  client: StorageClient,
  appId: string,
  table: string,
  dispatch: (action: StorageAction) => void,
): Promise<void> {
  dispatch({ type: 'select', table })
  try {
    dispatch({ type: 'table', rows: await client.readTable(appId, table) })
  } catch (error) {
    dispatch({ type: 'table-failed', ...thrown(error) })
  }
}

function thrown(error: unknown): { message: string } | Record<string, never> {
  const message = error instanceof Error ? error.message : ''
  return message.length > 0 ? { message } : {}
}

function omitError(state: StorageState): Omit<StorageState, 'error'> {
  const { error: gone, ...rest } = state
  void gone
  return rest
}

function omitTableError(state: StorageState): Omit<StorageState, 'tableError'> {
  const { tableError: gone, ...rest } = state
  void gone
  return rest
}
