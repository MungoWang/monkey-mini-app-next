import { describe, expect, it } from 'vitest'

import { closeTab, deletePrompt, dropAppTab, initialTabs, openAppTab, switchTab } from '../src/gallery/tabs.ts'

describe('panel tabs', () => {
  it('keeps the gallery, focuses an open app without reload, and asks before delete', () => {
    const start = initialTabs()
    const opened = openAppTab(start, 'com.example.app', 'Example')
    expect(opened.reload).toBe(false)
    expect(opened.tabs.active).toBe(1)
    const again = openAppTab(opened.tabs, 'com.example.app')
    expect(again.reload).toBe(false)
    expect(again.tabs.tabs).toHaveLength(2)
    expect(switchTab(again.tabs, 0).reload).toBe(false)
    expect(closeTab(again.tabs, 0).tabs).toHaveLength(2)
    expect(closeTab(again.tabs, 1).tabs).toEqual([{ kind: 'gallery' }])
    expect(deletePrompt('idle', 'ask')).toBe('confirm')
    expect(deletePrompt('confirm', 'cancel')).toBe('idle')
    expect(deletePrompt('confirm', 'fail')).toBe('failed')
    expect(deletePrompt('idle', 'fail')).toBe('idle')
    expect(deletePrompt('failed', 'fail')).toBe('failed')
    expect(closeTab(start, 3).tabs).toHaveLength(1)
  })

  it('renames an open tab, drops a failed open, and ignores a missing app id', () => {
    const opened = openAppTab(initialTabs(), 'com.example.app', 'One')
    const renamed = openAppTab(opened.tabs, 'com.example.app', 'Two')
    expect(renamed.tabs.tabs[1]).toEqual({ kind: 'app', appId: 'com.example.app', title: 'Two' })
    expect(renamed.reload).toBe(false)
    const second = openAppTab(renamed.tabs, 'com.example.other', 'Other')
    expect(dropAppTab(second.tabs, 'com.example.other').tabs.map(tab => tab.kind)).toEqual(['gallery', 'app'])
    expect(dropAppTab(second.tabs, 'com.example.missing')).toBe(second.tabs)
    expect(switchTab(second.tabs, -1).tabs).toBe(second.tabs)
    expect(switchTab(second.tabs, 99).tabs).toBe(second.tabs)
  })
})
