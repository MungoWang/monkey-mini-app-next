import { readFile } from 'node:fs/promises'

import type { AppPin } from './pin.ts'
import { themeTokens } from './tokens.ts'
import { parseThemeCss } from './parse.ts'
import { appThemeCss, builtinThemePath, customThemePath } from './layout.ts'

export interface FirstPaint {
  source: 'app-file' | 'custom' | 'builtin' | 'host'
  paletteId: string | null
  ignored?: string
  light: Record<string, string>
  dark: Record<string, string>
  style: string
}

/**
 * Choose the palette that paints the first frame. Token names are copied, not renamed.
 * A file that fails to parse is ignored. The next source in order is used.
 * @param input - pin, host palette id, and the directories that hold theme files
 */
export async function resolveFirstPaint(input: {
  appDir: string
  pin: AppPin
  hostPalette: string
  themesDir: string
}): Promise<FirstPaint> {
  if (input.pin.kind === 'follow-host') return await hostPaint(input.hostPalette, input.themesDir)
  if (input.pin.kind === 'palette') {
    const chosen = await readPalette(input.themesDir, input.pin.id)
    if (chosen !== undefined) return chosen
  }
  const local = await readPaint(appThemeCss(input.appDir), 'app', 'app-file')
  const ignored = input.pin.kind === 'palette'
    ? `custom palette ${input.pin.id} was ignored`
    : input.pin.kind === 'app-file' ? 'app theme.css was ignored' : undefined
  if (local !== undefined) return { ...local, ...ignored === undefined ? {} : { ignored } }
  const host = await hostPaint(input.hostPalette, input.themesDir)
  return { ...host, ...ignored === undefined ? {} : { ignored } }
}

/** Both modes from one theme file. The picker applies this without reloading a document. */
export function styleFromThemeCss(css: string): string {
  return firstPaintStyle(varsFor(css, 'light'), varsFor(css, 'dark'))
}

/** CSS to bake into the first HTML response. Empty when the source has no file. */
export function firstPaintStyle(light: Record<string, string>, dark: Record<string, string>): string {
  return `${block('light', light)}${block('dark', dark)}`
}

async function hostPaint(paletteId: string, themesDir: string): Promise<FirstPaint> {
  return await readPalette(themesDir, paletteId) ?? { source: 'host', paletteId, light: {}, dark: {}, style: '' }
}

async function readPalette(themesDir: string, id: string): Promise<FirstPaint | undefined> {
  const custom = await readPaint(customThemePath(themesDir, id), id, 'custom')
  if (custom !== undefined) return { ...custom, paletteId: id }
  const builtin = await readPaint(builtinThemePath(id), id, 'builtin')
  return builtin === undefined ? undefined : { ...builtin, paletteId: id }
}

async function readPaint(
  file: string,
  fallbackName: string,
  source: 'app-file' | 'custom' | 'builtin',
): Promise<FirstPaint | undefined> {
  const css = await readFile(file, 'utf8').catch(() => undefined)
  if (css === undefined) return undefined
  const parsed = parseThemeCss(css, fallbackName)
  if (!parsed.ok) return undefined
  const light = varsFor(css, 'light')
  const dark = varsFor(css, 'dark')
  return { source, paletteId: null, light, dark, style: firstPaintStyle(light, dark) }
}

function varsFor(css: string, mode: 'light' | 'dark'): Record<string, string> {
  const body = modeBlock(css, mode)
  if (body === undefined) return {}
  const vars: Record<string, string> = {}
  for (const token of themeTokens) {
    const value = tokenValue(body, token)
    if (value === undefined) continue
    vars[`--${token}`] = value
  }
  return vars
}

function modeBlock(css: string, mode: 'light' | 'dark'): string | undefined {
  const at = css.indexOf(`data-mode="${mode}"`)
  if (at < 0) return undefined
  const open = css.indexOf('{', at)
  const close = open < 0 ? -1 : css.indexOf('}', open)
  if (open < 0 || close < 0) return undefined
  return css.slice(open + 1, close)
}

function tokenValue(block: string, token: string): string | undefined {
  const match = new RegExp(`(?:^|[\\s;{])--${token}\\s*:\\s*([^;\\n]+)`).exec(block)
  const value = match?.[1]?.trim()
  return value === undefined || value.length === 0 ? undefined : value
}

function block(mode: 'light' | 'dark', vars: Record<string, string>): string {
  const body = Object.entries(vars).map(([name, value]) => `${name}:${value}`).join(';')
  if (body.length === 0) return ''
  return `:root[data-mode="${mode}"]{${body}}`
}
