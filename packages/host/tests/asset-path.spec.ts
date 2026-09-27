import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { admitAssetInner, admitAssetRef, assetInvalidCode, assetMediaType } from '../src/compile/asset-path.ts'
import { readAppAsset } from '../src/http/asset.ts'

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

describe('admitAssetRef', () => {
  it('admits an app-root assets path and rejects anything else', () => {
    expect(admitAssetRef('./assets/landing-img.png')).toBe('landing-img.png')
    expect(admitAssetRef('assets/icons/mark.svg')).toBe('icons/mark.svg')
    expect(admitAssetRef('assets\\hero.JPG')).toBe('hero.JPG')
    expect(assetMediaType('hero.JPG')).toBe('image/jpeg')
    expect(() => admitAssetRef('../assets/x.png')).toThrow(expect.objectContaining({ code: assetInvalidCode }))
    expect(() => admitAssetRef('./logo.png')).toThrow(expect.objectContaining({ code: assetInvalidCode }))
    expect(() => admitAssetRef('assets/note.txt')).toThrow(expect.objectContaining({ code: assetInvalidCode }))
    expect(() => admitAssetRef('assets/../secret.png')).toThrow(expect.objectContaining({ code: assetInvalidCode }))
    expect(() => admitAssetInner('landing-img.png')).not.toThrow()
    expect(() => admitAssetInner('../secret.png')).toThrow(expect.objectContaining({ code: assetInvalidCode }))
  })
})

describe('readAppAsset', () => {
  it('returns the file and 404s an escape or a miss', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-asset-'))
    await mkdir(join(dir, 'assets', 'icons'), { recursive: true })
    await writeFile(join(dir, 'assets', 'mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
    await writeFile(join(dir, 'assets', 'icons', 'dot.png'), png)
    await writeFile(join(dir, 'secret.png'), png)
    const svg = await readAppAsset(dir, 'mark.svg')
    expect(svg.type).toBe('image/svg+xml')
    expect(Buffer.from(svg.bytes).toString('utf8')).toContain('<svg')
    const nested = await readAppAsset(dir, 'icons/dot.png')
    expect(nested.type).toBe('image/png')
    expect(nested.bytes.byteLength).toBe(png.byteLength)
    await expect(readAppAsset(dir, 'missing.png')).rejects.toMatchObject({ code: 'not-found' })
    await expect(readAppAsset(dir, '../secret.png')).rejects.toMatchObject({ code: 'not-found' })
    const outside = await mkdtemp(join(tmpdir(), 'mma-asset-out-'))
    await writeFile(join(outside, 'leak.png'), png)
    await symlink(join(outside, 'leak.png'), join(dir, 'assets', 'leak.png'))
    await expect(readAppAsset(dir, 'leak.png')).rejects.toMatchObject({ code: 'not-found' })
  })
})
