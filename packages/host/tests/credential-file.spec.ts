import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { createFileCredentials, deleteFileCredential, writeFileCredential } from '../src/credentials/file.ts'

describe('credential file source', () => {
  it('writes and removes one account without a second API', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-cred-file-'))
    const file = join(dir, 'credentials.json')
    await writeFileCredential(file, 'github', '个人 GitHub', 'ghp_test')
    const source = createFileCredentials(file)
    expect(await source.list()).toEqual([{ name: 'github', description: '个人 GitHub' }])
    expect(await source.get('github')).toBe('ghp_test')
    await deleteFileCredential(file, 'missing')
    await deleteFileCredential(file, 'github')
    expect(await source.get('github')).toBeUndefined()
    await expect(writeFileCredential(file, '', 'x', 'y')).rejects.toMatchObject({ code: 'credential-invalid' })
    await writeFile(file, '{')
    await expect(writeFileCredential(file, 'github', 'x', 'y')).rejects.toMatchObject({ code: 'credential-unreadable' })
  })
})
