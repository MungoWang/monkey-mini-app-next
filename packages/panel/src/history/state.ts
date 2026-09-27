import type { HistoryClient, HistoryCommit, HistoryDetail } from './client.ts'

export interface HistoryState {
  readonly commits: readonly HistoryCommit[]
  readonly failed: boolean
  readonly selected?: string
  readonly detail?: HistoryDetail
  readonly detailFailed: boolean
  readonly error?: string
  readonly detailError?: string
}

export type HistoryAction =
  | { readonly type: 'loaded'; readonly commits: readonly HistoryCommit[] }
  | { readonly type: 'failed'; readonly message?: string }
  | { readonly type: 'select'; readonly commitId: string }
  | { readonly type: 'detail'; readonly detail: HistoryDetail }
  | { readonly type: 'detail-failed'; readonly message?: string }

/** Empty history before the load. */
export function historyState(): HistoryState {
  return { commits: [], failed: false, detailFailed: false }
}

/**
 * History view transition. Read-only. Reset is not a panel action.
 * @param state - current history
 * @param action - one client result
 */
export function reduceHistory(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'loaded':
      return { commits: action.commits, failed: false, detailFailed: false }
    case 'failed':
      return { ...omitDetailError(omitError(state)), failed: true, commits: [], ...action.message ? { error: action.message } : {} }
    case 'select':
      return { ...state, selected: action.commitId, detailFailed: false }
    case 'detail':
      return { ...omitDetailError(state), detail: action.detail, detailFailed: false }
    case 'detail-failed':
      return { ...omitDetailError(state), detailFailed: true, ...action.message ? { detailError: action.message } : {} }
    default:
      return action satisfies never
  }
}

/** Load the commit list. A thrown error is a failed pane, not an empty history. */
export async function loadHistory(
  client: HistoryClient,
  appId: string,
  dispatch: (action: HistoryAction) => void,
): Promise<void> {
  try {
    dispatch({ type: 'loaded', commits: await client.readHistory(appId) })
  } catch (error) {
    dispatch({ type: 'failed', ...thrown(error) })
  }
}

/** Load one commit preview. */
export async function loadCommit(
  client: HistoryClient,
  appId: string,
  commitId: string,
  dispatch: (action: HistoryAction) => void,
): Promise<void> {
  dispatch({ type: 'select', commitId })
  try {
    dispatch({ type: 'detail', detail: await client.readCommit(appId, commitId) })
  } catch (error) {
    dispatch({ type: 'detail-failed', ...thrown(error) })
  }
}

function thrown(error: unknown): { message: string } | Record<string, never> {
  const message = error instanceof Error ? error.message : ''
  return message.length > 0 ? { message } : {}
}

function omitError(state: HistoryState): Omit<HistoryState, 'error'> {
  const { error: gone, ...rest } = state
  void gone
  return rest
}

function omitDetailError(state: HistoryState): Omit<HistoryState, 'detailError'> {
  const { detailError: gone, ...rest } = state
  void gone
  return rest
}
