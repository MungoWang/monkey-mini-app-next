import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Theme file names and pin sentinels. Spell them here, not at each call site. */
export const themeLayout = {
  appCss: 'theme.css',
  appPin: 'theme.json',
  followHost: '__global__',
  appFile: '__local__',
  customPrefix: 'theme-',
  customSuffix: '.css',
} as const

const CUSTOM_ID = /^[a-z0-9-]+$/

export function appThemeCss(appDir: string): string {
  return path.join(appDir, themeLayout.appCss)
}

export function appThemePin(appDir: string): string {
  return path.join(appDir, themeLayout.appPin)
}

export function customThemePath(themesDir: string, id: string): string {
  return path.join(themesDir, `${themeLayout.customPrefix}${id}${themeLayout.customSuffix}`)
}

/** Shipped theme files. Same contract as a custom file. Ids come from the filenames. */
export function builtinThemesDir(): string {
  return fileURLToPath(new URL('../../themes', import.meta.url))
}

export function builtinThemePath(id: string): string {
  return customThemePath(builtinThemesDir(), id)
}

/** Parse `theme-<id>.css`. A name that does not match is not a palette id. */
export function customThemeId(filename: string): string | undefined {
  if (!filename.startsWith(themeLayout.customPrefix) || !filename.endsWith(themeLayout.customSuffix)) return undefined
  const id = filename.slice(themeLayout.customPrefix.length, -themeLayout.customSuffix.length)
  return CUSTOM_ID.test(id) ? id : undefined
}
