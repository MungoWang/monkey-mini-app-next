/** One palette chip. Ignored files are not chips. */
export interface PaletteChip {
  readonly id: string
  /** English (or sole) display name. */
  readonly name: string
  /** Chinese display name when the theme file provides one. */
  readonly nameZh?: string
  readonly swatch?: string
  readonly style?: string
}

export interface IgnoredPalette {
  readonly file: string
  readonly reason: string
}

/** Pin the owner can set. Clear is `default`, not deletion of `theme.css`. */
export type ThemePin =
  | { readonly kind: 'default' }
  | { readonly kind: 'follow-host' }
  | { readonly kind: 'app-file' }
  | { readonly kind: 'palette'; readonly id: string }

/** Theme reads and pin writes. Absent means the picker is hidden. No route string lives here. */
export interface ThemeClient {
  listPalettes(): Promise<{ palettes: readonly PaletteChip[]; ignored: readonly IgnoredPalette[] }>
  readPin?(appId: string): Promise<ThemePin>
  setPin(appId: string, pin: ThemePin): Promise<ThemePin>
  appFile?(appId: string): Promise<boolean>
}
