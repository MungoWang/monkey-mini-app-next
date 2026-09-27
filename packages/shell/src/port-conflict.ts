import { createServer, type Server } from 'node:http'
import type { ChildProcess } from 'node:child_process'

import { allocateHostPort } from '@mini-app/host'

import { openPanelWindow, type WindowSpawn } from './window.ts'

export type PortConflictDecision =
  | { readonly kind: 'accept'; readonly port: number }
  | { readonly kind: 'quit' }

export type PortConflictMode = 'prompt' | 'accept' | 'quit'

/**
 * Existing host.json port is busy. Prompt (or auto-decide in tests) before rewriting it.
 * A temporary loopback page shows busy → suggested; accept does not start Host.
 */
export async function resolvePortConflict(options: {
  readonly busyPort: number
  readonly suggestedPort: number
  readonly locale?: string
  readonly mode?: PortConflictMode
  readonly openWindow?: boolean
  readonly windowSpawn?: WindowSpawn
  readonly windowBinary?: string
  /** Fires once the temporary confirm origin is listening (tests and headless logs). */
  readonly onReady?: (origin: string) => void
}): Promise<PortConflictDecision> {
  const mode = options.mode ?? 'prompt'
  if (mode === 'accept') return { kind: 'accept', port: options.suggestedPort }
  if (mode === 'quit') return { kind: 'quit' }

  const suggested = options.suggestedPort > 0
    ? options.suggestedPort
    : await allocateHostPort(options.busyPort + 1)
  const locale = options.locale ?? 'en'
  const page = conflictPage({ busyPort: options.busyPort, suggestedPort: suggested, locale })

  return await new Promise<PortConflictDecision>((resolve, reject) => {
    let child: ChildProcess | undefined
    let settled = false
    const server: Server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        res.end(page)
        return
      }
      if (req.method === 'POST' && url.pathname === '/accept') {
        finish({ kind: 'accept', port: suggested })
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('ok')
        return
      }
      if (req.method === 'POST' && url.pathname === '/quit') {
        finish({ kind: 'quit' })
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('ok')
        return
      }
      res.writeHead(404)
      res.end()
    })

    function finish(decision: PortConflictDecision): void {
      if (settled) return
      settled = true
      child?.kill()
      server.close(() => {
        resolve(decision)
      })
    }

    server.once('error', (error) => {
      if (!settled) {
        settled = true
        reject(error)
      }
    })
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address !== null ? address.port : 0
      const origin = `http://127.0.0.1:${port}`
      options.onReady?.(origin)
      if (options.openWindow === false) return
      try {
        child = openPanelWindow(origin, options.windowSpawn, options.windowBinary)
      } catch (error) {
        // Headless / missing binary: still serve the page for curl/tests.
        console.error(error instanceof Error ? error.message : error)
        console.error(`Port ${options.busyPort} is in use. Open ${origin} to choose ${suggested} or quit.`)
      }
    })
  })
}

function conflictPage(input: {
  readonly busyPort: number
  readonly suggestedPort: number
  readonly locale: string
}): string {
  const zh = input.locale.startsWith('zh')
  const title = zh ? '端口被占用' : 'Port in use'
  const lead = zh
    ? `本机端口 <strong>${input.busyPort}</strong> 已被占用，Host 无法按已保存的配置启动。`
    : `Port <strong>${input.busyPort}</strong> is already in use, so Host cannot start with the saved config.`
  const suggest = zh
    ? `建议改用空闲端口 <strong>${input.suggestedPort}</strong>。`
    : `Suggested free port: <strong>${input.suggestedPort}</strong>.`
  const mcp = zh
    ? '若助手里已安装写作 MCP，改端口后请到设置 → Agent 更新或重装 MCP 连接，否则助手会连到旧端口。'
    : 'If authoring MCP is already installed on assistants, update or reinstall it under Settings → Agent after changing the port, or assistants will keep the old URL.'
  const accept = zh ? `改用 ${input.suggestedPort} 并继续` : `Use ${input.suggestedPort} and continue`
  const quit = zh ? '退出' : 'Quit'
  return `<!doctype html>
<html lang="${zh ? 'zh-CN' : 'en'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b0b0c; color: #f4f4f5; }
    main { width: min(28rem, calc(100vw - 2rem)); border: 1px solid #27272a; border-radius: 1rem; padding: 1.25rem 1.35rem; background: #18181b; }
    h1 { margin: 0 0 0.75rem; font-size: 1.15rem; }
    p { margin: 0 0 0.75rem; line-height: 1.45; color: #d4d4d8; font-size: 0.95rem; }
    .row { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 1rem; }
    button { border: 0; border-radius: 0.65rem; padding: 0.55rem 0.9rem; font: inherit; font-weight: 600; cursor: pointer; }
    .go { background: #fafafa; color: #09090b; }
    .stop { background: transparent; color: #e4e4e7; border: 1px solid #3f3f46; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${lead}</p>
    <p>${suggest}</p>
    <p>${mcp}</p>
    <p><code>${input.busyPort}</code> → <code>${input.suggestedPort}</code></p>
    <div class="row">
      <button type="button" class="go" id="accept">${accept}</button>
      <button type="button" class="stop" id="quit">${quit}</button>
    </div>
  </main>
  <script>
    async function post(path) {
      await fetch(path, { method: 'POST' })
    }
    document.getElementById('accept').onclick = () => { void post('/accept') }
    document.getElementById('quit').onclick = () => { void post('/quit') }
  </script>
</body>
</html>
`
}
