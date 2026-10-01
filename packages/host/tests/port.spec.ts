import { createServer } from 'node:net'

import { describe, expect, it } from 'vitest'

import { allocateHostPort, isHostPortFree, isPortInUseError, PortInUseError } from '../src/index.ts'

describe('isPortInUseError', () => {
  it('admits the class and a wire-shaped port-in-use object', () => {
    expect(isPortInUseError(new PortInUseError(9743, 9744))).toBe(true)
    expect(isPortInUseError({ code: 'port-in-use', busyPort: 9743, suggestedPort: 9744 })).toBe(true)
    expect(isPortInUseError({ code: 'port-in-use', busyPort: 9743 })).toBe(false)
    expect(isPortInUseError({ code: 'config-invalid', busyPort: 9743, suggestedPort: 9744 })).toBe(false)
    expect(isPortInUseError(new Error('port 9743 is in use'))).toBe(false)
    expect(isPortInUseError(null)).toBe(false)
    expect(isPortInUseError('port-in-use')).toBe(false)
  })

  it('carries the busy port and the suggested port', () => {
    const error = new PortInUseError(9743, 9744)
    expect(error.code).toBe('port-in-use')
    expect(error.name).toBe('PortInUseError')
    expect(error.message).toBe('port 9743 is in use')
    expect(error.busyPort).toBe(9743)
    expect(error.suggestedPort).toBe(9744)
  })
})

describe('isHostPortFree', () => {
  it('reports a bound port as busy and the same port as free after release', async () => {
    const busy = await boundPort()
    await expect(isHostPortFree(busy.port)).resolves.toBe(false)
    await busy.release()
    await expect(isHostPortFree(busy.port)).resolves.toBe(true)
  })
})

describe('allocateHostPort', () => {
  it('returns the preferred port when it is free', async () => {
    const port = await freePort()
    await expect(allocateHostPort(port, { min: port, max: port }, 1)).resolves.toBe(port)
  })

  it('skips a busy preferred port and clamps a preference outside the bound', async () => {
    const busy = await boundPort()
    const free = await freePort()
    try {
      const walked = await allocateHostPort(busy.port, { min: busy.port, max: busy.port + 4 }, 5)
      expect(walked).not.toBe(busy.port)
      await expect(isHostPortFree(walked)).resolves.toBe(true)
      await expect(allocateHostPort(Number.NaN, { min: free, max: free }, 1)).resolves.toBe(free)
      await expect(allocateHostPort(1, { min: free, max: free }, 1)).resolves.toBe(free)
      await expect(allocateHostPort(70_000, { min: free, max: free }, 1)).resolves.toBe(free)
    } finally {
      await busy.release()
    }
  })

  it('falls back to an ephemeral port when the span is exhausted', async () => {
    const busy = await boundPort()
    try {
      const port = await allocateHostPort(busy.port, { min: busy.port, max: busy.port }, 1)
      expect(port).not.toBe(busy.port)
      expect(port).toBeGreaterThan(0)
    } finally {
      await busy.release()
    }
  })
})

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address !== null ? address.port : 0
      server.close((error) => {
        if (error) reject(error)
        else resolve(port)
      })
    })
  })
}

function boundPort(): Promise<{ port: number; release: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address !== null ? address.port : 0
      resolve({
        port,
        release: () => new Promise<void>((done) => {
          server.close(() => {
            done()
          })
        }),
      })
    })
  })
}
