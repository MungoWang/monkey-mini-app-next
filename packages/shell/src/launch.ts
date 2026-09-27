/**
 * Panel directory and window binary selected by the process environment.
 * An empty value keeps the built-in path. The names are not locked.
 */

/** Directory that contains `panel.html` and `panel.js`. */
export function panelDirectory(env: NodeJS.ProcessEnv, fallback: string): string {
  const value = env.MINI_APP_PANEL
  if (value === undefined || value === '') return fallback
  return value
}

/** Window binary override. Unset means the built-in release-then-debug path. */
export function windowOverride(env: NodeJS.ProcessEnv): string | undefined {
  const value = env.MINI_APP_WINDOW
  if (value === undefined || value === '') return undefined
  return value
}
