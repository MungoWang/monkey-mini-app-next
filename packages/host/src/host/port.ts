import { createServer } from 'node:net'

import { DEFAULT_PORT_BOUND, type PortBound } from './config.ts'

/** How many successive ports to probe after the preferred one. Host policy, not locked. */
export const HOST_PORT_PROBE_SPAN = 64

/**
 * Preferred port is busy on an existing `host.json`.
 * Start does not rebind or rewrite the file; the caller offers a confirm path.
 */
export class PortInUseError extends Error {
  readonly code = 'port-in-use' as const
  readonly busyPort: number
  readonly suggestedPort: number

  constructor(busyPort: number, suggestedPort: number) {
    super(`port ${busyPort} is in use`)
    this.name = 'PortInUseError'
    this.busyPort = busyPort
    this.suggestedPort = suggestedPort
  }
}

export function isPortInUseError(error: unknown): error is PortInUseError {
  return error instanceof PortInUseError
    || (typeof error === 'object' && error !== null && 'code' in error && error.code === 'port-in-use'
      && 'busyPort' in error && 'suggestedPort' in error)
}

/** True when loopback can bind `port` right now. */
export function isHostPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => {
      resolve(false)
    })
    server.listen(port, '127.0.0.1', () => {
      server.close(() => {
        resolve(true)
      })
    })
  })
}

/**
 * First free loopback port at or above `preferred` within the probe span and bound.
 * Falls back to an ephemeral OS port when the span is exhausted.
 */
export async function allocateHostPort(
  preferred: number,
  ports: PortBound = DEFAULT_PORT_BOUND,
  span = HOST_PORT_PROBE_SPAN,
): Promise<number> {
  const start = clampPort(preferred, ports)
  const last = Math.min(ports.max, start + span - 1)
  for (let port = start; port <= last; port++) {
    if (await isHostPortFree(port)) return port
  }
  return ephemeralHostPort()
}

function clampPort(port: number, ports: PortBound): number {
  if (!Number.isInteger(port)) return ports.min
  if (port < ports.min) return ports.min
  if (port > ports.max) return ports.max
  return port
}

function ephemeralHostPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
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
