import type { PaletteChip, IgnoredPalette, ThemeClient, ThemePin } from './client.ts'

export interface ThemeState {
  readonly palettes: readonly PaletteChip[]
  readonly ignored: readonly IgnoredPalette[]
  readonly pin: ThemePin
  readonly failed: boolean
  readonly appFile: boolean
  readonly error?: string
}

export type ThemeAction =
  | { readonly type: 'loaded'; readonly palettes: readonly PaletteChip[]; readonly ignored: readonly IgnoredPalette[] }
  | { readonly type: 'failed'; readonly message?: string }
  | { readonly type: 'saved'; readonly pin: ThemePin }
  | { readonly type: 'save-failed'; readonly message?: string }
  | { readonly type: 'app-file'; readonly parsed: boolean }
  | { readonly type: 'pin'; readonly pin: ThemePin }

/** Picker before the palette list loads. */
export function themeState(): ThemeState {
  return { palettes: [], ignored: [], pin: { kind: 'default' }, failed: false, appFile: false }
}

/**
 * Theme picker transition. A failed save leaves the previous pin.
 * @param state - current picker
 * @param action - one client result
 */
export function reduceTheme(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'loaded':
      return { ...omitError(state), palettes: action.palettes, ignored: action.ignored, failed: false }
    case 'failed':
      return { ...omitError(state), failed: true, ...action.message ? { error: action.message } : {} }
    case 'saved':
      return { ...omitError(state), pin: action.pin, failed: false }
    case 'save-failed':
      return { ...omitError(state), failed: true, ...action.message ? { error: action.message } : {} }
    case 'app-file':
      return { ...state, appFile: action.parsed }
    case 'pin':
      return { ...omitError(state), pin: action.pin, failed: false }
    default:
      return action satisfies never
  }
}

/** Refetch palettes when the picker opens. */
export async function loadPalettes(
  client: ThemeClient,
  dispatch: (action: ThemeAction) => void,
): Promise<void> {
  try {
    const listed = await client.listPalettes()
    dispatch({ type: 'loaded', palettes: listed.palettes, ignored: listed.ignored })
  } catch (error) {
    dispatch({ type: 'failed', ...thrown(error) })
  }
}

/** Read the stored pin when the picker opens. A missing method leaves the default. */
export async function loadPin(
  client: ThemeClient,
  appId: string,
  dispatch: (action: ThemeAction) => void,
): Promise<void> {
  if (client.readPin === undefined) return
  try {
    dispatch({ type: 'pin', pin: await client.readPin(appId) })
  } catch (error) {
    dispatch({ type: 'failed', ...thrown(error) })
  }
}

/** Ask whether this app's `theme.css` parsed. A missing method leaves the row hidden. */
export async function loadAppFile(
  client: ThemeClient,
  appId: string,
  dispatch: (action: ThemeAction) => void,
): Promise<void> {
  if (client.appFile === undefined) return
  try {
    dispatch({ type: 'app-file', parsed: await client.appFile(appId) })
  } catch {
    dispatch({ type: 'app-file', parsed: false })
  }
}

/** Save a pin. Failure does not change the previous pin. */
export async function savePin(
  client: ThemeClient,
  appId: string,
  pin: ThemePin,
  dispatch: (action: ThemeAction) => void,
): Promise<void> {
  try {
    dispatch({ type: 'saved', pin: await client.setPin(appId, pin) })
  } catch (error) {
    dispatch({ type: 'save-failed', ...thrown(error) })
  }
}

function thrown(error: unknown): { message: string } | Record<string, never> {
  const message = error instanceof Error ? error.message : ''
  return message.length > 0 ? { message } : {}
}

function omitError(state: ThemeState): Omit<ThemeState, 'error'> {
  const { error: gone, ...rest } = state
  void gone
  return rest
}
