/** Required files and side trees. Callers use these names; they do not spell them again. */
export const appEntries = {
  manifest: 'manifest.json',
  ui: 'ui.tsx',
  backend: 'main.api.ts',
  stylesheet: 'ui.css',
} as const

/** Optional trees. `schema` is numbered SQL. `assets` is UI files loaded by URL. The others are import sides. */
export const appTrees = {
  ui: 'ui',
  api: 'api',
  shared: 'shared',
  schema: 'schema',
  assets: 'assets',
} as const
