import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { bootHost } from './boot.ts'
import { panelDirectory, windowOverride } from './launch.ts'
import { bindPanelLifetime, bindSupervisedLifetime, isSupervised } from './panel-lifetime.ts'
import { openPanelWindow } from './window.ts'

const dist = panelDirectory(process.env, path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist'))

const html = await readFile(path.join(dist, 'panel.html'), 'utf8').catch(() => {
  throw new Error('panel bundle is missing. Run pnpm build:panel')
})
const script = await readFile(path.join(dist, 'panel.js'), 'utf8')
const runtimeRoot = process.env.MINI_APP_RUNTIME
const hostPort = portFrom(process.env.MINI_APP_HOST_PORT)
const skipWindow = process.env.MINI_APP_SKIP_WINDOW === '1'
const host = await bootHost({
  panel: { html, script },
  ...runtimeRoot === undefined || runtimeRoot === '' ? {} : { runtimeRoot },
  ...hostPort === undefined ? {} : { hostPort },
})
const origin = `http://127.0.0.1:${host.policy.hostPort}`
console.log(origin)

if (isSupervised(process.env)) {
  bindSupervisedLifetime({
    dispose: () => host.dispose(),
    exit: (code) => { process.exit(code) },
  })
} else await bindPanelLifetime({
  runtimeRoot: host.policy.runtimeRoot,
  env: process.env,
  skipWindow,
  open: () => {
    const binary = windowOverride(process.env)
    return binary === undefined ? openPanelWindow(origin) : openPanelWindow(origin, undefined, binary)
  },
  dispose: () => host.dispose(),
  exit: (code) => { process.exit(code) },
})

function portFrom(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined
  const port = Number(value)
  return Number.isInteger(port) ? port : undefined
}
