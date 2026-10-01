/** One platform-module table. The UI compiler, the backend loader, and the iframe import map all read it. */

export type PlatformSide = 'ui' | 'backend' | 'both'

/** Served iframe file names. Spell them here, not at each call site. */
export const platformLayout = {
  root: '/mma',
  runtime: 'runtime.js',
  sdk: 'sdk.js',
  vendors: 'vendors',
} as const

export interface PlatformModule {
  specifier: string
  side: PlatformSide
  file?: string
  /** Compile this pattern into the app. A `/*` row is not a served file. */
  bundle?: boolean
}

const runtimeFile = platformRuntimePath()
const lodashFile = platformVendorPath('lodash')
const motionFile = platformVendorPath('motion')

export const platformModules: readonly PlatformModule[] = [
  { specifier: '@mohou/contract', side: 'backend' },
  { specifier: 'react', side: 'ui', file: runtimeFile },
  { specifier: 'react/jsx-runtime', side: 'ui', file: runtimeFile },
  { specifier: 'react-dom', side: 'ui', file: runtimeFile },
  { specifier: 'react-dom/client', side: 'ui', file: runtimeFile },
  { specifier: '@mohou/ui', side: 'ui', file: platformSdkPath() },
  { specifier: 'lodash', side: 'both', file: lodashFile },
  { specifier: 'lodash-es', side: 'both', file: lodashFile },
  { specifier: 'lodash/*', side: 'both', bundle: true },
  { specifier: 'lodash-es/*', side: 'both', bundle: true },
  { specifier: 'motion', side: 'ui', file: motionFile },
  { specifier: 'motion/react', side: 'ui', file: motionFile },
]

/** Whether this side may import the specifier. An exact row wins over a pattern. */
export function platformModuleAllowed(specifier: string, side: 'ui' | 'backend'): boolean {
  const row = platformRow(specifier)
  if (row === undefined) return false
  return row.side === 'both' || row.side === side
}

/** A pattern row with `bundle` is compiled into the app. The root row stays the served file. */
export function platformBundled(specifier: string): boolean {
  return platformRow(specifier)?.bundle === true
}

function platformRow(specifier: string): PlatformModule | undefined {
  const exact = platformModules.find(row => row.specifier === specifier)
  if (exact !== undefined) return exact
  return platformModules.find(row => matchesPattern(row.specifier, specifier))
}

/** A trailing `/*` matches that prefix plus at least one character. */
function matchesPattern(pattern: string, specifier: string): boolean {
  if (!pattern.endsWith('/*')) return false
  const prefix = pattern.slice(0, -1)
  return specifier.startsWith(prefix) && specifier.length > prefix.length
}

/** Import map for the iframe. Only rows with a served file. */
export function platformImportMap(): Readonly<Record<string, string>> {
  const imports: Record<string, string> = {}
  for (const row of platformModules) {
    if (row.file === undefined || row.side === 'backend' || row.specifier.includes('*')) continue
    imports[row.specifier] = row.file
  }
  return imports
}

export function platformRuntimePath(): string {
  return joinPlatform(platformLayout.runtime)
}

export function platformSdkPath(): string {
  return joinPlatform(platformLayout.sdk)
}

export function platformVendorPath(id: string): string {
  return joinPlatform(`${platformLayout.vendors}/${id}.js`)
}

function joinPlatform(name: string): string {
  return `${platformLayout.root}/${name}`
}
