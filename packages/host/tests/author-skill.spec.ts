import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { admitSkillsDir, readAuthorSkill, revealAuthorSkill, skillVersionOf, writeAuthorSkill } from '../src/host/author-skill.ts'

describe('author skill install', () => {
  it('copies into selected assistant folders and rejects a path that is not skills', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-skill-'))
    const source = join(root, 'mohou-mini-app')
    const claude = join(root, '.claude')
    await mkdir(source)
    await writeFile(join(source, 'SKILL.md'), '---\nname: mohou-mini-app\nversion: 1.0.0\n---\n# skill\n', 'utf8')
    const layout = {
      source,
      agents: [{ id: 'claude', label: 'Claude', skillsDir: join(claude, 'skills'), detectDir: claude }],
    }
    expect(await readAuthorSkill(layout)).toMatchObject({
      skillId: 'mohou-mini-app',
      version: '1.0.0',
      agents: [{ id: 'claude', homePresent: false, installed: false, version: null, updateAvailable: false }],
    })
    const wrote = await writeAuthorSkill(layout, ['claude'], [])
    expect(wrote.agents[0]).toMatchObject({ installed: true, version: '1.0.0', updateAvailable: false })
    expect(await readFile(join(claude, 'skills', 'mohou-mini-app', 'SKILL.md'), 'utf8')).toContain('version: 1.0.0')
    expect(() => admitSkillsDir(join(root, 'nope'), root)).toThrow('skills')
    expect(admitSkillsDir(join(root, 'work', 'skills'), root)).toBe(join(root, 'work', 'skills'))
  })

  it('marks an older or unversioned copy as updateAvailable', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-skill-ver-'))
    const source = join(root, 'mohou-mini-app')
    const destDir = join(root, '.pi', 'agent', 'skills', 'mohou-mini-app')
    await mkdir(source)
    await mkdir(destDir, { recursive: true })
    await writeFile(join(source, 'SKILL.md'), '---\nversion: 1.2.0\n---\n', 'utf8')
    await writeFile(join(destDir, 'SKILL.md'), '# stub\n', 'utf8')
    const layout = {
      source,
      agents: [{ id: 'pi', label: 'Pi', skillsDir: join(root, '.pi', 'agent', 'skills'), detectDir: join(root, '.pi', 'agent') }],
    }
    expect(await readAuthorSkill(layout)).toMatchObject({
      version: '1.2.0',
      agents: [{ installed: true, version: null, updateAvailable: true }],
    })
    await writeFile(join(destDir, 'SKILL.md'), '---\nversion: 1.0.0\n---\n', 'utf8')
    expect(await readAuthorSkill(layout)).toMatchObject({
      agents: [{ installed: true, version: '1.0.0', updateAvailable: true }],
    })
    await writeFile(join(destDir, 'SKILL.md'), '---\nversion: 1.2.0\n---\n', 'utf8')
    expect(await readAuthorSkill(layout)).toMatchObject({
      agents: [{ installed: true, version: '1.2.0', updateAvailable: false }],
    })
    expect(skillVersionOf('---\nversion: "1.0.0"\n---\n')).toBe('1.0.0')
    expect(skillVersionOf('# no frontmatter\n')).toBeNull()
    expect(skillVersionOf('---\nname: x\n')).toBeNull()
    expect(admitSkillsDir('~/work/skills', root)).toBe(join(root, 'work', 'skills'))
    expect(() => admitSkillsDir('  ', root)).toThrow('empty')
  })

  it('copies a custom skills dir and refuses a dest it does not own', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-skill-custom-'))
    const source = join(root, 'mohou-mini-app')
    const custom = join(root, 'work', 'skills')
    await mkdir(source)
    await writeFile(join(source, 'SKILL.md'), '---\nversion: 1.0.0\n---\n', 'utf8')
    const layout = { source, agents: [] }
    const wrote = await writeAuthorSkill(layout, [], [custom], root)
    expect(wrote.customs[0]).toMatchObject({ installed: true, version: '1.0.0' })
    await expect(revealAuthorSkill(layout, join(root, 'nope'), root, 'linux')).rejects.toMatchObject({ code: 'config-invalid' })
    await expect(revealAuthorSkill(layout, join(custom, 'mohou-mini-app'), root, 'linux')).rejects.toMatchObject({ code: 'config-invalid' })
  })
})
