import { describe, expect, it } from 'vitest'

import { buildFailureText, FAILURE_LINES_MAX } from '../src/compile/failure.ts'

describe('buildFailureText', () => {
  it('reads the location and the text of a message', () => {
    const text = buildFailureText({
      errors: [{
        text: 'No matching export in "shared/mcp.ts" for import "MCP_PRESETS"',
        location: { file: 'ui.tsx', line: 1, column: 9 },
      }],
    })
    expect(text).toBe('ui.tsx:1:9: No matching export in "shared/mcp.ts" for import "MCP_PRESETS"')
  })

  it('keeps a message that has no location', () => {
    expect(buildFailureText({ errors: [{ text: 'plugin said no', location: null }] })).toBe('plugin said no')
  })

  it('reports nothing for a value that carries no message', () => {
    expect(buildFailureText(new Error('socket closed'))).toBeUndefined()
    expect(buildFailureText({ errors: [] })).toBeUndefined()
    expect(buildFailureText({ errors: [{ location: null }] })).toBeUndefined()
    expect(buildFailureText({ errors: 'one' })).toBeUndefined()
    expect(buildFailureText(undefined)).toBeUndefined()
  })

  it('caps the lines and counts the rest', () => {
    const errors = Array.from({ length: FAILURE_LINES_MAX + 2 }, (_, index) => ({ text: `error ${index}`, location: null }))
    const text = buildFailureText({ errors }) ?? ''
    expect(text.split('\n')).toHaveLength(FAILURE_LINES_MAX + 1)
    expect(text).toContain('and 2 more')
  })
})
