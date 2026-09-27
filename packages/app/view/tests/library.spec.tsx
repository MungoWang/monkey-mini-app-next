/** @vitest-environment jsdom */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { WorkbenchLibrary } from '../src/library.tsx'

const todo = { id: 'com.example.todo', name: 'Todo', description: 'A list', version: '1', acronym: 'TO' }
const desk = { ...todo, id: 'com.example.desk', name: 'Desk', kind: 'workbench' as const }

describe('WorkbenchLibrary', () => {
  it('renders a workbench as a card, with nothing above it', () => {
    const markup = renderToStaticMarkup(createElement(WorkbenchLibrary, {
      apps: [todo, desk],
      cardStyle: 'glass',
      openLabel: 'Open',
      openAppIds: [todo.id],
      openApp: () => undefined,
    }))
    expect(markup).toContain('Desk')
    expect(markup).toContain('Open')
    expect(markup).not.toContain('data-default-workbench')
    expect(markup).not.toContain('Set as default')
  })
})
