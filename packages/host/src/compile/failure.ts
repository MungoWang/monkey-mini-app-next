import type * as esbuild from 'esbuild'

/** Error lines one compile message carries. Host policy, not a locked number. */
export const FAILURE_LINES_MAX = 5

/**
 * What esbuild said went wrong, one line per message. A resolve plugin names its own failures; this covers the rest.
 * @param error - the value `esbuild.build` rejected with
 */
export function buildFailureText(error: unknown): string | undefined {
  const errors = failureErrors(error)
  if (errors.length === 0) return undefined
  const lines = errors.slice(0, FAILURE_LINES_MAX).map(oneLine)
  const hidden = errors.length - lines.length
  if (hidden > 0) lines.push(`and ${hidden} more`)
  return lines.join('\n')
}

function failureErrors(error: unknown): readonly esbuild.Message[] {
  if (typeof error !== 'object' || error === null) return []
  const found: unknown = 'errors' in error ? error.errors : undefined
  if (!Array.isArray(found)) return []
  return found.filter(isMessage)
}

function isMessage(value: unknown): value is esbuild.Message {
  return typeof value === 'object'
    && value !== null
    && 'text' in value
    && typeof value.text === 'string'
    && value.text.length > 0
}

function oneLine(message: esbuild.Message): string {
  const at = message.location
  if (at === null) return message.text
  return `${at.file}:${at.line}:${at.column}: ${message.text}`
}
