import { Hono } from 'hono'

import { type createAuthorTools } from '../tools/author.ts'
import type { DiagnosticPorts } from '../tools/diagnostics.ts'
import { isLoopbackAddress } from './guard.ts'
import { mountAuthor } from './author.ts'
import type { HostEnv } from './env.ts'
import { mountIframe } from './iframe.ts'
import { mountOwner } from './owner.ts'
import type { LoopbackPorts } from './ports.ts'

type AuthorTools = ReturnType<typeof createAuthorTools>

/**
 * One loopback app. Author, owner, and iframe are separate mounts.
 * @param options - the tool implementation, the token, and the owner ports when the session has them
 */
export function createLoopbackApp(options: {
  readonly author: AuthorTools
  readonly token: string
  readonly diagnostics?: DiagnosticPorts
  readonly loopback?: LoopbackPorts
}): Hono<HostEnv> {
  const app = new Hono<HostEnv>()
  app.use('*', async (c, next) => {
    const address = c.env.incoming.socket.remoteAddress
    if (!isLoopbackAddress(address)) {
      return c.json({ ok: false, error: { code: 'authoring-loopback', message: 'authoring caller is not loopback' } }, 403)
    }
    await next()
  })
  mountIframe(app, {
    ...options.diagnostics === undefined ? {} : { diagnostics: options.diagnostics },
    ...options.loopback === undefined ? {} : { loopback: options.loopback },
  })
  if (options.loopback !== undefined) mountOwner(app, options.loopback)
  mountAuthor(app, options.author, options.token)
  app.notFound((c) => {
    const authorRoute = c.req.path === '/mcp' || c.req.path.startsWith('/api/tools')
    if (authorRoute) {
      return c.json({ ok: false, error: { code: 'unknown-tool', message: 'authoring route is not mounted' } }, 404)
    }
    return c.json({ ok: false, error: { code: 'not-found', message: 'route is not mounted' } }, 404)
  })
  return app
}
