#!/usr/bin/env node
/**
 * Authoring connectivity diagnose. Run when mini_app_* tools fail.
 * Prints one JSON object on stdout. Exit 0 only when Host about and authoring MCP look usable.
 *
 * Usage (from this skill tree): node bin/diagnose.mjs
 *
 * Port is never asked of the agent. Resolution matches Host boot:
 *   MINI_APP_HOST_PORT → ~/.mini-app/runtime/host.json hostPort (or MINI_APP_RUNTIME) → seed default.
 */
import { homedir } from 'node:os'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Same seed as shell first boot when host.json is missing. Not a locked product port. */
const SEED_PORT = 9743
const CORE_TOOLS = [
  'mini_app_list',
  'mini_app_register',
  'mini_app_reload',
  'mini_app_call',
  'mini_app_open',
]

const report = {
  ok: false,
  steps: /** @type {Record<string, unknown>} */ ({}),
}

function fail(step, detail) {
  report.ok = false
  report.failedStep = step
  report.steps[step] = { ok: false, ...detail }
  console.log(JSON.stringify(report, null, 2))
  process.exit(1)
}

function ok(step, detail) {
  report.steps[step] = { ok: true, ...detail }
}

function portFromEnv(value) {
  if (value === undefined || value === '') return undefined
  const n = Number(value)
  return Number.isInteger(n) ? n : undefined
}

const runtimeRoot = process.env.MINI_APP_RUNTIME?.trim()
  || path.join(homedir(), '.mini-app', 'runtime')

const hostJsonPath = path.join(runtimeRoot, 'host.json')
if (!existsSync(runtimeRoot)) {
  fail('runtime', { message: `runtime root missing: ${runtimeRoot}` })
}

/** @type {'env' | 'host.json' | 'seed'} */
let portSource = 'seed'
let hostPort = SEED_PORT

const envPort = portFromEnv(process.env.MINI_APP_HOST_PORT)
if (envPort !== undefined) {
  hostPort = envPort
  portSource = 'env'
}

if (existsSync(hostJsonPath)) {
  try {
    const raw = JSON.parse(readFileSync(hostJsonPath, 'utf8'))
    if (portSource !== 'env' && typeof raw.hostPort === 'number' && Number.isInteger(raw.hostPort)) {
      hostPort = raw.hostPort
      portSource = 'host.json'
    }
    ok('runtime', { runtimeRoot, hostJson: true, hostPort, portSource })
  } catch (error) {
    fail('runtime', { runtimeRoot, message: error instanceof Error ? error.message : 'host.json unreadable' })
  }
} else {
  ok('runtime', { runtimeRoot, hostJson: false, hostPort, portSource })
}

const origin = `http://127.0.0.1:${hostPort}`

// Host about
let about
try {
  const res = await fetch(`${origin}/api/about`, { signal: AbortSignal.timeout(3000) })
  if (!res.ok) fail('host', { origin, status: res.status, portSource })
  about = await res.json()
  const authoring = about?.authoring && typeof about.authoring === 'object' ? about.authoring : {}
  const token = typeof authoring.token === 'string' ? authoring.token : ''
  const url = typeof authoring.url === 'string' ? authoring.url : ''
  ok('host', {
    origin,
    name: about?.name,
    current: about?.current,
    authoringUrl: url || null,
    authoringToken: token ? `${token.slice(0, 4)}…(${token.length})` : null,
    portSource,
  })
  if (!url || !token) fail('about', { message: 'authoring.url or authoring.token missing on /api/about' })
  report.authoring = { url, token }
} catch (error) {
  fail('host', { origin, portSource, message: error instanceof Error ? error.message : 'fetch failed' })
}

// local skill version
const skillMd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../SKILL.md')
let skillVersion = null
if (existsSync(skillMd)) {
  const text = readFileSync(skillMd, 'utf8')
  const m = /^version:\s*["']?(\d+\.\d+\.\d+)["']?\s*$/m.exec(text)
  skillVersion = m?.[1] ?? null
}
ok('skill', { path: skillMd, version: skillVersion, hostCurrent: about?.current ?? null })

// authoring MCP tools/list
const mcpUrl = report.authoring.url
const token = report.authoring.token
delete report.authoring
try {
  const res = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    }),
    signal: AbortSignal.timeout(5000),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) fail('mcp', { url: mcpUrl, status: res.status, body })
  const tools = Array.isArray(body?.result?.tools)
    ? body.result.tools.map((t) => t?.name).filter((n) => typeof n === 'string')
    : []
  const missing = CORE_TOOLS.filter((name) => !tools.includes(name))
  ok('mcp', { url: mcpUrl, toolCount: tools.length, missing })
  if (missing.length > 0) fail('tools', { missing, sample: tools.slice(0, 12) })
  ok('tools', { core: CORE_TOOLS })
} catch (error) {
  fail('mcp', { url: mcpUrl, message: error instanceof Error ? error.message : 'mcp failed' })
}

report.ok = true
console.log(JSON.stringify(report, null, 2))
process.exit(0)
