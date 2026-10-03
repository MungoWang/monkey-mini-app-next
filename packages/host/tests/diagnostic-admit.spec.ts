import { describe, expect, it } from 'vitest'

import { acceptDiagnostic, diagnosticLayout, type DiagnosticPorts } from '../src/tools/diagnostics.ts'

describe('acceptDiagnostic', () => {
  it('drops a bad body and admits alive, absence, errors, and a view answer', () => {
    const seen: string[] = []
    const ports: DiagnosticPorts = {
      recordError(_appId, raw) {
        seen.push(`error:${JSON.stringify(raw)}`)
      },
      markAlive() {
        seen.push('alive')
      },
      markAbsent() {
        seen.push('absent')
      },
      answerView(requestId) {
        seen.push(`view:${requestId}`)
        return true
      },
    }
    acceptDiagnostic(ports, 'com.example.app', diagnosticLayout.errors, '{')
    acceptDiagnostic(ports, 'com.example.app', diagnosticLayout.alive, '{}')
    acceptDiagnostic(ports, 'com.example.app', diagnosticLayout.absent, '{}')
    acceptDiagnostic(ports, 'com.example.app', diagnosticLayout.errors, '{"kind":"render"}')
    acceptDiagnostic(ports, 'com.example.app', diagnosticLayout.viewEval, '{"requestId":"1"}')
    acceptDiagnostic(ports, 'com.example.app', diagnosticLayout.viewEval, '{}')
    expect(seen).toEqual(['alive', 'absent', 'error:{"kind":"render"}', 'view:1'])
  })
})
