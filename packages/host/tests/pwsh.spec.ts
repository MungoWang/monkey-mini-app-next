import { describe, expect, it } from 'vitest'

import { PwshError, createPwsh, pwshCandidates, type BashPolicy } from '../src/index.ts'

const policy: BashPolicy = { timeoutMs: 200, maxOutputBytes: 1000 }

describe('pwsh', () => {
  it('tries pwsh, and on Windows also Windows PowerShell', () => {
    expect(pwshCandidates('darwin')).toEqual(['pwsh'])
    expect(pwshCandidates('win32')).toEqual(['pwsh', 'powershell.exe'])
  })

  it('does not fall back to bash when pwsh is missing', async () => {
    const pwsh = createPwsh(policy, undefined, 'mma-missing-pwsh')
    await expect(pwsh.run('Write-Output hi')).rejects.toBeInstanceOf(PwshError)
    await expect(pwsh.run('Write-Output hi')).rejects.toMatchObject({ code: 'pwsh-unavailable' })
    await pwsh.dispose()
  })
})
