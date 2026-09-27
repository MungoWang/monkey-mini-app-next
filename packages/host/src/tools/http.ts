import { createAdaptorServer } from '@hono/node-server'

import { closeMcpSessions } from '../http/author.ts'
import { createLoopbackApp } from '../http/app.ts'
import { authoringTokenMatches, isLoopbackAddress } from '../http/guard.ts'
import type { LoopbackPorts } from '../http/ports.ts'
import { type createAuthorTools } from './author.ts'
import type { DiagnosticPorts } from './diagnostics.ts'

type AuthorTools = ReturnType<typeof createAuthorTools>

export { authoringTokenMatches, isLoopbackAddress }

/**
 * Loopback listener. Author, owner, and iframe routes are one Hono app.
 * @param options - the tool implementation, the token, and owner ports when the session has them
 */
export function startAuthorHttp(options: {
  readonly author: AuthorTools
  readonly token: string
  readonly port?: number
  readonly diagnostics?: DiagnosticPorts
  readonly loopback?: LoopbackPorts
}): Promise<{ port: number; close: () => Promise<void> }> {
  const app = createLoopbackApp(options)
  const server = createAdaptorServer({ fetch: app.fetch })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(options.port ?? 0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address !== null ? address.port : 0
      resolve({
        port,
        close: async () => {
          await closeMcpSessions()
          await new Promise<void>((done, fail) => {
            server.close((error) => {
              if (error) fail(error)
              else done()
            })
            // Open panel sockets, including the event stream, would keep close pending.
            if ('closeAllConnections' in server) server.closeAllConnections()
          })
        },
      })
    })
  })
}
