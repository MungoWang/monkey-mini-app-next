import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { appEntries, ContractError } from '@mohou/contract'
import * as esbuild from 'esbuild'

import { platformBundled } from './allowlist.ts'
import { CompileError } from './codes.ts'
import { importDecision, sideOf } from './imports.ts'

const require = createRequire(import.meta.url)

export interface UiBundle {
  readonly code: string
}

/**
 * Bundle `ui.tsx` in memory. React and motion stay external. Lodash is included. Component names are kept.
 * A relative import whose real path leaves the app is `import-escape`.
 * @param appDir - absolute app directory
 * @param logLevel - `silent` when the caller already expects the build to fail. Omitted, esbuild prints the failure.
 */
export async function bundleUi(appDir: string, logLevel?: 'silent'): Promise<UiBundle> {
  const stopped: { code: string; message: string } = { code: '', message: '' }
  let result: esbuild.BuildResult
  try {
    result = await esbuild.build({
      absWorkingDir: appDir,
      entryPoints: [path.join(appDir, appEntries.ui)],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      jsx: 'automatic',
      keepNames: true,
      write: false,
      ...logLevel === undefined ? {} : { logLevel },
      plugins: [uiPlugin(appDir, stopped)],
    })
  } catch (error) {
    const code = stopped.code
    if (code === 'import-forbidden' || code === 'import-escape') {
      throw new ContractError(code, stopped.message, { cause: error })
    }
    throw new CompileError('ui-invalid', stopped.message || 'ui failed to bundle', { cause: error })
  }
  const code = result.outputFiles?.[0]?.text
  if (code === undefined) throw new CompileError('ui-invalid', 'ui produced no bundle')
  return { code }
}

function uiPlugin(appDir: string, stopped: { code: string; message: string }): esbuild.Plugin {
  const root = realpathSync(appDir)
  return {
    name: 'mini-app-ui',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') return undefined
        if (args.importer.length > 0 && inside(root, args.importer) === undefined) return undefined
        const importer = args.importer.length > 0 ? inside(root, args.importer) ?? appEntries.ui : appEntries.ui
        if (args.path.startsWith('.')) {
          const decision = importDecision(sideOf(importer), args.path, importer)
          if (decision !== 'allow') {
            const denied = typeof decision === 'object'
              ? decision
              : { code: 'import-forbidden' as const, message: `ui cannot import ${args.path}` }
            stopped.code = denied.code
            stopped.message = denied.message
            return { errors: [{ text: stopped.message }] }
          }
          return resolveInside(root, args, stopped)
        }
        const decision = importDecision(sideOf(importer), args.path, importer)
        if (decision === 'allow' && platformBundled(args.path)) {
          try {
            return { path: require.resolve(args.path) }
          } catch (error) {
            stopped.code = 'ui-invalid'
            stopped.message = `ui cannot resolve ${args.path}`
            return { errors: [{ text: stopped.message, detail: error }] }
          }
        }
        if (decision === 'allow') return { path: args.path, external: true }
        const denied = typeof decision === 'object'
          ? decision
          : { code: 'import-forbidden' as const, message: `ui cannot import ${args.path}` }
        stopped.code = denied.code
        stopped.message = denied.message
        return { errors: [{ text: stopped.message }] }
      })
    },
  }
}

function resolveInside(
  root: string,
  args: { path: string; importer: string },
  stopped: { code: string; message: string },
): esbuild.OnResolveResult {
  const base = path.dirname(args.importer)
  const target = path.resolve(base, args.path)
  const real = resolveSourceFile(target)
  if (real === undefined) {
    stopped.code = 'ui-invalid'
    stopped.message = `ui cannot resolve ${args.path}`
    return { errors: [{ text: stopped.message }] }
  }
  const rel = path.relative(root, real)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    stopped.code = 'import-escape'
    stopped.message = `ui cannot import ${args.path}`
    return { errors: [{ text: stopped.message }] }
  }
  return { path: real }
}

/** Extensionless relative imports (templates often omit `.tsx`). */
function resolveSourceFile(target: string): string | undefined {
  const suffixes = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js']
  for (const suffix of suffixes) {
    try {
      return realpathSync(`${target}${suffix}`)
    } catch {
      // try next
    }
  }
  return undefined
}

function inside(root: string, file: string): string | undefined {
  const real = realpathSync(file)
  const rel = path.relative(root, real)
  if (rel.startsWith('..') || path.isAbsolute(rel)) return undefined
  return rel.split(path.sep).join('/')
}
