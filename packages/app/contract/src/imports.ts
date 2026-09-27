import { ContractError, type DefinitionCode } from './codes.ts'
import { appEntries, appTrees } from './entries.ts'

/** Which side of the app is importing. */
export type ImportSide = 'ui' | 'backend' | 'shared'

function crosses(specifier: string, tree: string): boolean {
  return specifier === tree || specifier.startsWith(`${tree}/`) || specifier.includes(`/${tree}/`)
}

function escapesApp(specifier: string, fromFile: string): boolean {
  if (specifier.startsWith('/') || /^[A-Za-z]:[\\/]/.test(specifier)) return true
  if (!specifier.startsWith('.')) return false
  const parts = fromFile.split('/').slice(0, -1).filter(part => part.length > 0)
  for (const part of specifier.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (parts.length === 0) return true
      parts.pop()
    } else {
      parts.push(part)
    }
  }
  return false
}

/**
 * Classify a relative or side-crossing import. Bare allowlist checks stay with the host table.
 * @param specifier - the import specifier as written
 * @param side - the file's side
 * @returns a code when the specifier is illegal, otherwise undefined
 */
export function classifyImport(specifier: string, side: ImportSide, fromFile = 'ui.tsx'): DefinitionCode | undefined {
  if (escapesApp(specifier, fromFile)) return 'import-escape'
  if (crosses(specifier, appTrees.assets)) return 'import-forbidden'
  if (side === 'ui' && (specifier === appEntries.backend || crosses(specifier, appTrees.api))) {
    return 'import-forbidden'
  }
  if (side === 'backend' && crosses(specifier, appTrees.ui)) return 'import-forbidden'
  if (side === 'shared' && (crosses(specifier, appTrees.ui) || crosses(specifier, appTrees.api) || specifier === appEntries.backend)) {
    return 'import-forbidden'
  }
  return undefined
}

/**
 * Throw when {@link classifyImport} returns a code.
 * @param specifier - the import specifier as written
 * @param side - the file's side
 */
export function assertImportAllowed(specifier: string, side: ImportSide): void {
  const code = classifyImport(specifier, side)
  if (code === undefined) return
  throw new ContractError(code, `${side} cannot import ${specifier}`)
}
