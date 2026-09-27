/** Codes `resolveAssetUrl` throws in the iframe. Callers match `code`. */
export const assetInvalidCode = 'asset-invalid' as const

/**
 * Admit an author path relative to the app directory.
 * Returns the path inside `assets/`. Throws `asset-invalid` otherwise.
 * Self-contained so the runner can inline it.
 */
export function admitAssetRef(raw: string): string {
  function fail(): never {
    const error = new Error('asset path is invalid') as Error & { code: string }
    error.code = 'asset-invalid'
    throw error
  }
  if (typeof raw !== 'string' || raw.length === 0) fail()
  const slash = raw.replace(/\\/g, '/')
  if (slash.startsWith('/') || /^[A-Za-z]:\//.test(slash)) fail()
  const fromRoot = slash.startsWith('./') ? slash.slice(2) : slash
  if (!fromRoot.startsWith('assets/')) fail()
  const inner = fromRoot.slice('assets/'.length)
  if (inner.length === 0 || inner.startsWith('/') || inner.startsWith('./') || inner.includes('..') || inner.includes('//')) fail()
  const parts = inner.split('/')
  const segment = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
  for (const part of parts) {
    if (!segment.test(part)) fail()
  }
  const last = parts[parts.length - 1] ?? ''
  const dot = last.lastIndexOf('.')
  if (dot <= 0) fail()
  const ext = last.slice(dot + 1).toLowerCase()
  if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg' && ext !== 'gif' && ext !== 'webp' && ext !== 'svg') fail()
  return parts.join('/')
}

/** Admit the URL tail after `/assets/`. */
export function admitAssetInner(raw: string): string {
  return admitAssetRef(`assets/${raw}`)
}

/** Content type for an admitted inner path. */
export function assetMediaType(inner: string): string {
  const ext = inner.slice(inner.lastIndexOf('.') + 1).toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  return 'image/svg+xml'
}
