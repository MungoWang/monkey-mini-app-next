/** Body cap for an iframe diagnostic post. Host policy, not a locked number. */
export const DEFAULT_DIAGNOSTIC_MAX_BYTES = 64_000

/** Diagnostic path segments. Spell them here, not at each caller. */
export const diagnosticLayout = {
  root: '/api/app',
  errors: 'errors',
  alive: 'alive',
  viewEval: 'view/eval',
} as const

export function diagnosticUrl(appId: string, kind: 'errors' | 'alive' | 'viewEval'): string {
  return `${diagnosticLayout.root}/${encodeURIComponent(appId)}/${diagnosticLayout[kind]}`
}

export interface DiagnosticPorts {
  recordError(appId: string, raw: unknown): void
  markAlive(appId: string): void
  answerView(requestId: string, appId: string, raw: unknown): boolean
  maxBodyBytes?: number
}

/** Admit one diagnostic body. A bad body is dropped. The route still answers 204. */
export function acceptDiagnostic(ports: DiagnosticPorts, appId: string, kind: string, body: string): void {
  let parsed: unknown
  try {
    parsed = JSON.parse(body) as unknown
  } catch {
    return
  }
  if (kind === diagnosticLayout.alive) {
    ports.markAlive(appId)
    return
  }
  if (kind === diagnosticLayout.errors) {
    ports.recordError(appId, parsed)
    return
  }
  if (kind === diagnosticLayout.viewEval && isRecord(parsed) && typeof parsed.requestId === 'string') {
    ports.answerView(parsed.requestId, appId, parsed)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
