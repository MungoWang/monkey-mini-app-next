/** @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import { DeskBar } from '../src/gallery/desk.tsx'

describe('DeskBar', () => {
  it('moves the pill, ignores a repeat click, and reports a new choice', async () => {
    const chosen: string[] = []
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const paint = async (selected: string) => {
      await act(async () => {
        root.render(
          <DeskBar
            label="Home"
            choices={[
              { id: 'default', name: 'Library' },
              { id: 'com.example.desk', name: 'Desk' },
            ]}
            selected={selected}
            onSelect={(id) => {
              chosen.push(id)
            }}
          />,
        )
      })
    }
    await paint('default')
    const pill = host.querySelector('.mma-desk-pill')
    expect(pill).not.toBeNull()
    const current = host.querySelector('[data-desk="default"]')
    expect(current?.getAttribute('data-on')).toBe('1')
    await act(async () => {
      current?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(chosen).toEqual([])
    const other = host.querySelector('[data-desk="com.example.desk"]')
    await act(async () => {
      other?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(chosen).toEqual(['com.example.desk'])
    await paint('com.example.desk')
    expect(host.querySelector('[data-desk="com.example.desk"]')?.getAttribute('data-on')).toBe('1')
    await act(async () => {
      root.unmount()
    })
    host.remove()
  })
})
