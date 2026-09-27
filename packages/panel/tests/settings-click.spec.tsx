/** @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import type { PanelPolicy, PanelSettingsClient } from '../src/settings/client.ts'
import { PanelSettings } from '../src/settings/view.tsx'

const policy: PanelPolicy = {
  theme: 'light',
  palette: 'default',
  locale: 'en',
  chatLanguage: 'en',
  hostPort: 9743,
  llm: null,
  runtimeProvider: { id: 'echo' },
}

describe('PanelSettings clicks', () => {
  it('shows a rejected save and a probe result', async () => {
    const client: PanelSettingsClient = {
      readPolicy: () => Promise.resolve(policy),
      writePolicy: () => Promise.reject(new Error('no')),
      probe: () => Promise.resolve({ healthy: false, message: 'down' }),
    }
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<PanelSettings client={client} locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    const network = host.querySelector('button[data-nav="network"]')
    await act(async () => {
      network?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    const port = host.querySelector('input[data-field="port"]')
    if (port instanceof HTMLInputElement) {
      port.value = '1'
      port.dispatchEvent(new Event('input', { bubbles: true }))
    }
    const save = [...host.querySelectorAll('button')].find(button => button.textContent === 'Save')
    await act(async () => {
      save?.click()
    })
    expect(host.textContent).toContain('no')
    const model = host.querySelector('button[data-nav="agent"]')
    await act(async () => {
      model?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    const probe = [...host.querySelectorAll('button')].find(button => button.textContent === 'Probe')
    await act(async () => {
      probe?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('down')
    root.unmount()
    host.remove()
  })

  it('clears the form after a successful save', async () => {
    const client: PanelSettingsClient = {
      readPolicy: () => Promise.resolve(policy),
      writePolicy: () => Promise.resolve({ policy, restartRequired: true }),
      probe: () => Promise.resolve({ healthy: true }),
      restartHost: () => Promise.reject(new Error('no')),
    }
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<PanelSettings client={client} locale="en" mode="production" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    const save = [...host.querySelectorAll('button')].find(button => button.textContent === 'Save')
    await act(async () => {
      save?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('The host must restart')
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'Restart host')?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toMatch(/restart|Restart|没能/i)
    const updating: PanelSettingsClient = {
      ...client,
      checkUpdate: () => Promise.reject(new Error('no')),
    }
    await act(async () => {
      root.render(<PanelSettings client={updating} locale="en" mode="production" versions="1.0" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    const about = host.querySelector('button[data-nav="about"]')
    await act(async () => {
      about?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    const update = [...host.querySelectorAll('button')].find(button => button.textContent === 'Check for updates')
    await act(async () => {
      update?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('Update check failed')
    const fresh: PanelSettingsClient = {
      ...client,
      checkUpdate: () => Promise.resolve({ name: 'host', current: '1.0.0', latest: '1.1.0', updateAvailable: true }),
    }
    await act(async () => {
      root.render(<PanelSettings client={fresh} locale="en" mode="production" versions="host 1.0.0" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      host.querySelector('button[data-nav="about"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'Check for updates')?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toContain('1.1.0')
    const current: PanelSettingsClient = {
      ...fresh,
      checkUpdate: () => Promise.resolve({ name: 'host', current: '1.0.0', latest: '1.0.0', updateAvailable: false, error: '' }),
    }
    await act(async () => {
      root.render(<PanelSettings client={current} locale="en" mode="production" versions="host 1.0.0" />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      host.querySelector('button[data-nav="about"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(async () => {
      [...host.querySelectorAll('button')].find(button => button.textContent === 'Check for updates')?.click()
      await Promise.resolve()
    })
    expect(host.textContent).toMatch(/up to date|已是最新|1.0.0/i)
    const styles: string[] = []
    await act(async () => {
      root.render(<PanelSettings client={client} locale="en" mode="production" cardStyle="hero" onCardStyle={style => styles.push(style)} palettes={[{ id: 'slate', name: 'Slate', swatch: '#000', style: '' }]} />)
    })
    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      host.querySelector('button[data-nav="appearance"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    for (const name of ['Stamp', 'Cutout', 'Firefly', 'List', 'Glow']) {
      await act(async () => {
        [...host.querySelectorAll('span')].find(span => span.textContent === name)?.parentElement?.click()
      })
    }
    expect(styles).toEqual(['stamp', 'etch', 'pulse', 'list', 'hero'])
    root.unmount()
    host.remove()
  })
})
