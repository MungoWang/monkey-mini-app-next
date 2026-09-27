import { lstat, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'

import { appTrees } from '@mini-app/contract'

import { admitAssetInner, assetMediaType } from '../compile/asset-path.ts'
import { RouteError } from './route-codes.ts'

export interface AppAsset {
  readonly bytes: Uint8Array<ArrayBuffer>
  readonly type: string
}

/**
 * Read one file under `assets/`. Missing, escaped, or illegal paths are `not-found`.
 * @param appDir - absolute app directory
 * @param rest - path after `/assets/`
 */
export async function readAppAsset(appDir: string, rest: string): Promise<AppAsset> {
  let inner: string
  try {
    inner = admitAssetInner(rest)
  } catch (error) {
    throw missing(error)
  }
  let root: string
  try {
    root = await realpath(path.join(appDir, appTrees.assets))
  } catch (error) {
    throw missing(error)
  }
  let real: string
  try {
    real = await realpath(path.resolve(root, inner))
  } catch (error) {
    throw missing(error)
  }
  const rel = path.relative(root, real)
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw missing()
  const info = await lstat(real).catch(() => undefined)
  if (info === undefined || !info.isFile()) throw missing()
  return { bytes: new Uint8Array(await readFile(real)), type: assetMediaType(inner) }
}

function missing(cause?: unknown): RouteError {
  return cause === undefined
    ? new RouteError('not-found', 'asset is missing')
    : new RouteError('not-found', 'asset is missing', { cause })
}
