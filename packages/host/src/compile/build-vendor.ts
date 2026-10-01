import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import * as esbuild from 'esbuild'

import { platformModules, type PlatformModule } from './allowlist.ts'

const require = createRequire(import.meta.url)

/** Package directory the loopback server reads. Built at pack time, or once before listen if absent. */
export function vendorOutputDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), '../../vendor')
}

/**
 * Write one file per distinct `file` in the table. Rows that share a `file` are one build,
 * from the first specifier. A `/*` row is not a vendor file. Does not mount a route.
 * @param options - output directory and the table, defaulting to `platformModules`
 * @returns paths written
 */
/** Bump when vendor transform contract changes so installed trees rebuild. */
const VENDOR_STAMP = 'jsx-automatic-1'

/** Build when a served file or the stamp is missing. A request never builds. */
export async function ensureVendorFiles(outDir: string): Promise<void> {
  const names = ['runtime.js', 'lodash.js', 'motion.js', 'sdk.js']
  const stampPath = path.join(outDir, '.stamp')
  const stampText = await readFile(stampPath, 'utf8').catch(() => '')
  const stampOk = stampText.trim() === VENDOR_STAMP
  if (stampOk && names.every(name => existsSync(path.join(outDir, name)))) return
  await buildVendorFiles({ outDir })
  await writeFile(stampPath, `${VENDOR_STAMP}
`)
}

export async function buildVendorFiles(options: {
  readonly outDir: string
  readonly rows?: readonly PlatformModule[]
}): Promise<string[]> {
  const rows = options.rows ?? platformModules
  const groups = new Map<string, string[]>()
  for (const row of rows) {
    if (row.file === undefined || row.specifier.includes('*')) continue
    const list = groups.get(row.file) ?? []
    list.push(row.specifier)
    groups.set(row.file, list)
  }
  const written: string[] = []
  for (const [file, specifiers] of groups) {
    const dest = path.join(options.outDir, path.basename(file))
    await mkdir(options.outDir, { recursive: true })
    await writeFile(dest, await buildGroup(file, specifiers))
    written.push(dest)
  }
  return written
}

async function buildGroup(file: string, specifiers: string[]): Promise<string> {
  const first = specifiers[0]
  if (first === undefined) throw new Error(`vendor produced no module: ${file}`)
  const result = await esbuild.build({
    stdin: {
      contents: facade(file, specifiers),
      resolveDir: path.dirname(require.resolve(first)),
      sourcefile: path.basename(file),
      loader: 'js',
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    // Packaged @mohou/ui has no tsconfig; without this, esbuild falls back to
    // classic JSX (`React.createElement`) and leaves bare `React` unbound in the iframe.
    jsx: 'automatic',
    external: vendorExternals(file),
    plugins: [workspacePackageExtensions()],
    ...file.endsWith('/sdk.js') ? { banner: { js: sdkReactRequire } } : {},
    write: false,
  })
  const code = result.outputFiles[0]?.text
  if (code === undefined) throw new Error(`vendor produced no module: ${file}`)
  return code
}

const sdkReactRequire = [
  "import * as ReactNs from 'react'",
  'const ReactMod = Object.assign({}, ReactNs.default, ReactNs)',
  'const require = (id) => {',
  "  if (id === 'react') return ReactMod",
  "  throw new Error('Dynamic require of \"' + id + '\" is not supported')",
  '}',
].join('\n')

function vendorExternals(file: string): string[] {
  if (file.endsWith('/runtime.js')) return []
  if (file.endsWith('/sdk.js')) return ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'motion', 'motion/react']
  return ['react', 'react/jsx-runtime']
}

/**
 * npm package exports map `@mohou/ui/*` → `./src/*` without a suffix.
 * esbuild then looks for an extensionless file and fails outside the monorepo TS resolver.
 */
function workspacePackageExtensions(): esbuild.Plugin {
  const scopes = ['@mohou/ui/', '@mohou/app-view/'] as const
  return {
    name: 'mini-app-package-extensions',
    setup(build) {
      build.onResolve({ filter: /^@mohou\/(ui|app-view)\// }, (args) => {
        const scope = scopes.find(prefix => args.path.startsWith(prefix))
        if (scope === undefined) return undefined
        const pkgName = scope.slice(0, -1)
        const sub = args.path.slice(scope.length)
        let pkgRoot: string
        try {
          pkgRoot = path.dirname(require.resolve(`${pkgName}/package.json`))
        } catch {
          return undefined
        }
        for (const ext of ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.js']) {
          const candidate = path.join(pkgRoot, 'src', `${sub}${ext}`)
          if (existsSync(candidate)) return { path: candidate }
        }
        return undefined
      })
    },
  }
}

function facade(file: string, specifiers: string[]): string {
  if (file.endsWith('/runtime.js')) {
    return [
      "import React from 'react'",
      "import { jsx, jsxs, Fragment } from 'react/jsx-runtime'",
      "import { createPortal, flushSync, unstable_batchedUpdates } from 'react-dom'",
      "import { createRoot, hydrateRoot } from 'react-dom/client'",
      'export { jsx, jsxs, Fragment, createRoot, hydrateRoot, createPortal, flushSync, unstable_batchedUpdates }',
      'export const {',
      '  Children, Component, PureComponent, StrictMode, Suspense,',
      '  cloneElement, createContext, createElement, createRef, forwardRef, isValidElement,',
      '  lazy, memo, startTransition, use, useCallback, useContext, useDebugValue,',
      '  useDeferredValue, useEffect, useId, useImperativeHandle, useInsertionEffect,',
      '  useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, useTransition,',
      '  version,',
      '} = React',
      'export default Object.assign({}, React, { createRoot, hydrateRoot, jsx, jsxs, Fragment })',
    ].join('\n')
  }
  if (file.endsWith('/motion.js')) {
    return "export * from 'motion'\nexport * from 'motion/react'\n"
  }
  const entry = specifiers.find(specifier => specifier.endsWith('-es')) ?? specifiers[0] ?? ''
  const lines = [`export * from ${JSON.stringify(entry)}`]
  if (specifiers.some(specifier => specifier === 'lodash' || specifier === 'lodash-es')) {
    lines.push(`export { default } from ${JSON.stringify(entry)}`)
  }
  return `${lines.join('\n')}\n`
}
