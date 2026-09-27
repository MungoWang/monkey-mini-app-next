import { requiredThemeTokens } from './tokens.ts'

/** Token names required in both modes. A short name such as `--bg` does not count. */

export interface ParsedTheme {
  /** Display name for English (and fallback). */
  name: string
  /** Optional Chinese display name. */
  nameZh?: string
}

/**
 * Admit a theme file. A missing required key ignores the file. It is not partially applied.
 * @param css - file text
 * @param fallbackName - id used when the header has no name
 */
export function parseThemeCss(css: string, fallbackName: string): { ok: true; theme: ParsedTheme } | { ok: false; reason: string } {
  for (const mode of ['light', 'dark'] as const) {
    const block = modeBlock(css, mode)
    if (block === undefined) return { ok: false, reason: `missing ${mode} mode` }
    for (const key of requiredThemeTokens) {
      if (!hasShort(block, key)) return { ok: false, reason: `missing --${key} in ${mode}` }
    }
  }
  return { ok: true, theme: headerNames(css, fallbackName) }
}

function modeBlock(css: string, mode: 'light' | 'dark'): string | undefined {
  const at = css.indexOf(`data-mode="${mode}"`)
  if (at < 0) return undefined
  const open = css.indexOf('{', at)
  const close = open < 0 ? -1 : css.indexOf('}', open)
  if (open < 0 || close < 0) return undefined
  return css.slice(open + 1, close)
}

function hasShort(block: string, key: string): boolean {
  return new RegExp(`(?:^|[\\s;{])--${key}\\s*:`).test(block)
}

/**
 * `/* name: English *\/` and optional `/* name-zh-CN: 中文 *\/`.
 * A single `name` that is only Chinese still works as the sole label.
 */
function headerNames(css: string, fallbackName: string): ParsedTheme {
  const name = headerField(css, 'name')
  const nameZh = headerField(css, 'name-zh-CN')
  if (name !== undefined && nameZh !== undefined) return { name, nameZh }
  if (name !== undefined) return { name }
  if (nameZh !== undefined) return { name: nameZh, nameZh }
  return { name: fallbackName }
}

function headerField(css: string, field: string): string | undefined {
  const match = new RegExp(`/\\*\\s*${field}:\\s*([^*]+?)\\s*\\*/`).exec(css)
  const value = match?.[1]?.trim()
  return value === undefined || value.length === 0 ? undefined : value
}
