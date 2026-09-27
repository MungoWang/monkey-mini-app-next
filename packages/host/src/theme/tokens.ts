/**
 * Theme tokens. The theme file declares these names. There is no second spelling.
 * A missing optional token is omitted. No invented fallback colour.
 */
export const themeTokens = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'border',
  'muted',
  'muted-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'ring',
  'input',
  'radius',
  'shadow',
] as const

export type ThemeToken = (typeof themeTokens)[number]

/** Required in both modes. A file missing one is ignored, not partially applied. */
export const requiredThemeTokens = ['background', 'foreground', 'primary'] as const
