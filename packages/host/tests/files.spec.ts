import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { FileToolError, createFileTools, resolveAppPath } from '../src/index.ts'

describe('file tools', () => {
  it('rejects absolute paths and parent segments on both path styles', () => {
    expect(() => resolveAppPath('/apps/a', '../b')).toThrow(FileToolError)
    expect(() => resolveAppPath('/apps/a', 'C:\\secret')).toThrow(FileToolError)
    expect(() => resolveAppPath('/apps/a', 'ui/../../outside')).toThrow(FileToolError)
    expect(() => resolveAppPath('/apps/a', '')).toThrow(FileToolError)
  })

  it('writes, edits, lists, and protects the manifest', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-files-'))
    await writeFile(join(dir, 'manifest.json'), '{}\n')
    await mkdir(join(dir, 'dist'), { recursive: true })
    await writeFile(join(dir, 'dist', 'out.js'), 'nope\n')
    await mkdir(join(dir, '.cache'), { recursive: true })
    await writeFile(join(dir, '.cache', 'tailwind'), 'nope\n')
    await mkdir(join(dir, 'logs'), { recursive: true })
    await writeFile(join(dir, 'logs', 'app.log'), 'nope\n')
    const tools = createFileTools(dir, { maxLines: 2, commit: async () => ({ status: 'committed' }) })
    await tools.write('ui/main.tsx', 'one\ntwo\nthree\n')
    const read = await tools.read('ui/main.tsx')
    expect(read.truncated).toBe(true)
    expect(read.endLine).toBe(2)
    await tools.edit('ui/main.tsx', [{ oldText: 'one', newText: '1' }])
    await expect(tools.edit('ui/main.tsx', [{ oldText: 'missing', newText: 'x' }])).rejects.toMatchObject({ code: 'edit-not-unique' })
    await expect(tools.edit('ui/main.tsx', [{ oldText: 'two', newText: '2' }, { oldText: 'two', newText: '2' }])).rejects.toMatchObject({ code: 'edit-not-unique' })
    await expect(tools.edit('gone.ts', [{ oldText: 'a', newText: 'b' }])).rejects.toMatchObject({ code: 'file-missing' })
    await expect(tools.delete('gone.txt')).rejects.toMatchObject({ code: 'file-missing' })
    await expect(tools.delete('manifest.json')).rejects.toMatchObject({ code: 'manifest-protected' })
    await expect(tools.delete('ui.tsx')).rejects.toMatchObject({ code: 'manifest-protected' })
    await expect(tools.delete('main.api.ts')).rejects.toMatchObject({ code: 'manifest-protected' })
    const listed = await tools.list()
    expect(listed.map(item => item.path).sort()).toEqual(['manifest.json', 'ui/main.tsx'])
    const numbered = await tools.read('ui/main.tsx', { start: 1, end: 1 }, true)
    expect(numbered.content.startsWith('1|')).toBe(true)
    await expect(tools.read('missing.ts')).rejects.toMatchObject({ code: 'file-missing' })
    await expect(tools.read('ui')).rejects.toMatchObject({ code: 'path-is-directory' })
    await expect(tools.write('ui', 'x')).rejects.toMatchObject({ code: 'path-is-directory' })
    const skipped = await createFileTools(dir).write('note.txt', 'a', false)
    expect(skipped.commit.status).toBe('skipped')
    await expect(createFileTools(dir, {
      protectedPath: file => file === 'note.txt',
    }).delete('note.txt')).rejects.toMatchObject({ code: 'manifest-protected' })
  })
})
