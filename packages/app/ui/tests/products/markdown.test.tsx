/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Markdown } from '../../src/products/markdown'

describe('Markdown', () => {
  it('renders headings and emphasis', () => {
    render(<Markdown>{'# Title\n\n**bold**'}</Markdown>)
    expect(screen.getByTestId('markdown').querySelector('h1')).toHaveTextContent('Title')
    expect(screen.getByTestId('markdown').querySelector('strong')).toHaveTextContent('bold')
  })

  it('renders a table and an ordered list with the reading styles', () => {
    render(<Markdown>{'1. one\n\n| a | b |\n| - | - |\n| 1 | 2 |'}</Markdown>)
    const root = screen.getByTestId('markdown')
    expect(root.querySelector('ol')).not.toBeNull()
    expect(root.querySelector('td')).toHaveTextContent('1')
    expect(root.className).toContain('[&_td]:px-2')
    expect(root.className).toContain('[&_ol]:list-decimal')
  })
})
