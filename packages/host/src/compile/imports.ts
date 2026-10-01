import { builtinModules } from 'node:module'

import { appEntries, appTrees, classifyImport, type DefinitionCode, type ImportSide } from '@mohou/contract'

import { platformModuleAllowed } from './allowlist.ts'

const nodeBuiltins = new Set(builtinModules)

export type ImportDecision =
  | { readonly code: DefinitionCode; readonly message: string }
  | 'allow'
  | 'builtin'
  | 'install'

/** One decision for a specifier. The loader and the reload check both call this. */
export function importDecision(side: ImportSide, specifier: string, fromFile = 'ui.tsx'): ImportDecision {
  const crossed = classifyImport(specifier, side, fromFile)
  if (crossed !== undefined) return { code: crossed, message: `${side} cannot import ${specifier}` }
  if (specifier.startsWith('.')) return 'allow'
  if (isNodeBuiltin(specifier)) {
    if (side === 'backend') return 'builtin'
    return { code: 'import-forbidden', message: `${side} cannot import ${specifier}` }
  }
  if (side !== 'shared' && platformModuleAllowed(specifier, side)) return 'allow'
  if (inPlatformTable(specifier)) return { code: 'import-forbidden', message: `${side} cannot import ${specifier}` }
  if (side === 'backend') return 'install'
  return { code: 'import-forbidden', message: `${side} cannot import ${specifier}` }
}

export function sideOf(rel: string): ImportSide {
  if (rel === appEntries.ui || rel.startsWith(`${appTrees.ui}/`)) return 'ui'
  if (rel.startsWith(`${appTrees.shared}/`)) return 'shared'
  return 'backend'
}

function inPlatformTable(specifier: string): boolean {
  return platformModuleAllowed(specifier, 'ui') || platformModuleAllowed(specifier, 'backend')
}

function isNodeBuiltin(specifier: string): boolean {
  const name = specifier.startsWith('node:') ? specifier.slice('node:'.length) : specifier
  return nodeBuiltins.has(name)
}
