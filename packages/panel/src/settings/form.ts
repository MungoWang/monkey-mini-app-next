import { isPanelLocale, type PanelLocale } from '../labels.ts'

/** Settings port range. Locked in the product decisions, not a host tunable. */
export const panelPortBound = { min: 1024, max: 65535 } as const

export type PanelPortResult =
  | { readonly ok: true; readonly port: number }
  | { readonly ok: false; readonly key: 'port-invalid' }

/**
 * Admit a settings port before any write. A bad value is not sent to Host.
 * @param value - the form value
 */
export function admitPanelPort(value: unknown): PanelPortResult {
  if (typeof value !== 'number' || !Number.isInteger(value)) return { ok: false, key: 'port-invalid' }
  if (value < panelPortBound.min || value > panelPortBound.max) return { ok: false, key: 'port-invalid' }
  return { ok: true, port: value }
}

/**
 * The one language control. Both fields are the same locale.
 * @param locale - `en` or `zh-CN`
 */
export function panelLanguageFields(locale: string): { locale: PanelLocale; chatLanguage: PanelLocale } {
  if (!isPanelLocale(locale)) throw new Error(`panel locale is not supported: ${locale}`)
  return { locale, chatLanguage: locale }
}
