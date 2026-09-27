/** @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import { AuthorMcpInstall } from '../src/settings/author-mcp-view.tsx'
import type { PanelAbout, PanelAuthorMcpStatus, PanelPolicy, PanelSettingsClient, PanelSkillStatus } from '../src/settings/client.ts'
import { SkillInstall } from '../src/settings/skill-install.tsx'
import { PanelSettings } from '../src/settings/view.tsx'
import { writeAuthorMcpAgentIds } from '../src/settings/author-mcp.ts'
import { writeSkillAgentIds, writeSkillCustomDirs } from '../src/settings/skill-dirs.ts'

const policy: PanelPolicy = {
  theme: 'light',
  palette: 'default',
  locale: 'en',
  chatLanguage: 'en',
  hostPort: 9743,
  llm: null,
  runtimeProvider: { id: 'echo' },
}

const skill: PanelSkillStatus = {
  skillId: 'monkey-mini-app',
  version: '1.0.2',
  agents: [
    {
      id: 'pi',
      label: 'Pi',
      skillsDir: '/Users/me/.pi/agent/skills',
      dest: '/Users/me/.pi/agent/skills/monkey-mini-app',
      homePresent: true,
      installed: true,
      version: '1.0.1',
      updateAvailable: true,
    },
    {
      id: 'kiro',
      label: 'Kiro',
      skillsDir: '/Users/me/.kiro/skills',
      dest: '/Users/me/.kiro/skills/monkey-mini-app',
      homePresent: false,
      installed: false,
      version: null,
      updateAvailable: false,
    },
  ],
  customs: [{
    dir: '/tmp/work/skills',
    dest: '/tmp/work/skills/monkey-mini-app',
    installed: true,
    version: '1.0.2',
    updateAvailable: false,
  }],
}

const mcp: PanelAuthorMcpStatus = {
  agents: [
    {
      id: 'pi',
      label: 'Pi',
      dest: '/Users/me/.pi/agent/mcp.json',
      homePresent: true,
      installed: true,
      updateAvailable: true,
    },
    {
      id: 'cursor',
      label: 'Cursor',
      dest: '/Users/me/.cursor/mcp.json',
      homePresent: false,
      installed: false,
      updateAvailable: false,
    },
  ],
}

const about: PanelAbout = {
  name: 'host',
  current: '0.0.0',
  platform: 'darwin',
  authoring: {
    url: 'http://127.0.0.1:9743/mcp',
    token: 'secret',
    tools: [{ name: 'mini_app_register', description: 'Create an app' }],
  },
}

describe('skill and authoring MCP install', () => {
  it('installs a writing skill, remembers picks, and reveals a dest', async () => {
    writeSkillAgentIds([])
    writeSkillCustomDirs([])
    let installed: string[] = []
    let revealed = ''
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<SkillInstall
        label={key => key}
        readSkill={() => Promise.resolve(skill)}
        installSkill={(ids, dirs) => {
          installed = [...ids, ...dirs]
          return Promise.resolve({
            ...skill,
            agents: skill.agents.map(agent => ({ ...agent, installed: true, updateAvailable: false, version: '1.0.2' })),
          })
        }}
        revealSkill={async (dest) => { revealed = dest }}
      />)
    })
    await flush()
    expect(host.textContent).toContain('Pi')
    expect(host.textContent).toContain('skill-update')
    const boxes = [...host.querySelectorAll('input[type="checkbox"]')]
    await act(async () => {
      if (boxes[1] instanceof HTMLInputElement) boxes[1].click()
    })
    const custom = host.querySelector('input[placeholder="skill-custom-hint"]')
    if (custom instanceof HTMLInputElement) {
      await act(async () => {
        custom.value = '/tmp/nope'
        custom.dispatchEvent(new Event('input', { bubbles: true }))
      })
    }
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'skill-add-dir')?.click()
    })
    expect(host.textContent).toContain('skill-custom-format')
    if (custom instanceof HTMLInputElement) {
      await act(async () => {
        custom.value = '/tmp/work/skills'
        custom.dispatchEvent(new Event('input', { bubbles: true }))
      })
    }
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'skill-add-dir')?.click()
    })
    await flush()
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'skill-update-install')?.click()
      await Promise.resolve()
    })
    expect(installed).toContain('kiro')
    const open = [...host.querySelectorAll('button')].find(button => button.textContent?.includes('monkey-mini-app'))
    await act(async () => {
      open?.click()
      await Promise.resolve()
    })
    expect(revealed).toContain('monkey-mini-app')
    root.unmount()
    host.remove()
  })

  it('installs authoring MCP and opens the snippet dialog', async () => {
    writeAuthorMcpAgentIds([])
    const clipboard: string[] = []
    Object.assign(navigator, { clipboard: { writeText: async (text: string) => { clipboard.push(text) } } })
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<AuthorMcpInstall
        label={key => key}
        readAuthorMcp={() => Promise.resolve(mcp)}
        installAuthorMcp={ids => Promise.resolve({
          agents: mcp.agents.map(agent => ({ ...agent, installed: ids.includes(agent.id), updateAvailable: false })),
        })}
        revealAuthorMcp={async () => undefined}
        readAbout={() => Promise.resolve(about)}
      />)
    })
    await flush()
    expect(host.textContent).toContain('Pi')
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'mcp-authoring-update-install')?.click()
      await Promise.resolve()
    })
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'mcp-authoring-generate')?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('mini_app_register')
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'mcp-copy')?.click()
      await Promise.resolve()
    })
    expect(clipboard[0]).toContain('secret')
    root.unmount()
    host.remove()
  })

  it('opens the agent section from settings', async () => {
    const client: PanelSettingsClient = {
      readPolicy: () => Promise.resolve(policy),
      writePolicy: () => Promise.resolve({ policy, restartRequired: false }),
      probe: () => Promise.resolve({ healthy: true }),
      listRuntimes: () => Promise.resolve([{ id: 'echo', models: [{ provider: 'echo', models: ['echo'] }] }]),
      readSkill: () => Promise.resolve(skill),
      readAuthorMcp: () => Promise.resolve(mcp),
    }
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<PanelSettings client={client} locale="en" mode="production" />)
    })
    await flush()
    await act(async () => {
      host.querySelector('button[data-nav="agent"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await flush()
    expect(host.textContent).toContain('Pi')
    expect(host.textContent).toContain('Kiro')
    root.unmount()
    host.remove()
  })

  it('drops a duplicate custom dir, removes one, and shows install failure', async () => {
    writeSkillCustomDirs(['/tmp/work/skills'])
    writeSkillAgentIds(['pi'])
    writeAuthorMcpAgentIds(['pi'])
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<SkillInstall
        label={key => key}
        readSkill={() => Promise.resolve(skill)}
        installSkill={() => Promise.reject(new Error('no'))}
        revealSkill={async () => undefined}
      />)
    })
    await flush()
    const custom = host.querySelector('input[placeholder="skill-custom-hint"]')
    if (custom instanceof HTMLInputElement) {
      await act(async () => {
        custom.value = '/tmp/work/skills'
        custom.dispatchEvent(new Event('input', { bubbles: true }))
      })
    }
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'skill-add-dir')?.click()
    })
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === '×')?.click()
    })
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'skill-update-install')?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('skill-failed')
    await act(async () => {
      root.render(<AuthorMcpInstall
        label={key => key}
        readAuthorMcp={() => Promise.resolve(mcp)}
        installAuthorMcp={() => Promise.reject(new Error('no'))}
        readAbout={() => Promise.reject(new Error('no'))}
      />)
    })
    await flush()
    await act(async () => {
      host.querySelector('input[type="checkbox"]')?.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'mcp-authoring-install' || button.textContent === 'mcp-authoring-update-install')?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('mcp-authoring-failed')
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'mcp-authoring-generate')?.click()
      await Promise.resolve()
    })
    root.unmount()
    host.remove()
  })

  it('keeps the form when the skill read fails and stores a new custom dir', async () => {
    writeSkillCustomDirs([])
    writeSkillAgentIds(['pi'])
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<SkillInstall label={key => key} readSkill={() => Promise.reject(new Error('no'))} />)
    })
    await flush()
    expect(host.textContent).toContain('skill-install')
    const remembered = {
      ...skill,
      agents: skill.agents.map(agent => ({ ...agent, updateAvailable: false })),
      customs: [{
        dir: '/tmp/other/skills',
        dest: '/tmp/other/skills/monkey-mini-app',
        installed: true,
        version: null,
        updateAvailable: true,
      }],
    }
    await act(async () => {
      root.render(<SkillInstall
        label={key => key}
        readSkill={() => Promise.resolve(remembered)}
        installSkill={() => Promise.resolve(remembered)}
      />)
    })
    await flush()
    const custom = host.querySelector('input[placeholder="skill-custom-hint"]')
    if (custom instanceof HTMLInputElement) setInput(custom, '/tmp/other/skills')
    await act(async () => {
      ;[...host.querySelectorAll('button')].find(button => button.textContent === 'skill-add-dir')?.click()
    })
    expect(host.textContent).toContain('/tmp/other/skills')
    expect(host.textContent).toContain('skill-update-install')
    root.unmount()
    host.remove()
  })
})

function setInput(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
  })
}
