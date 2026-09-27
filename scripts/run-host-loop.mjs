#!/usr/bin/env node
/**
 * Relaunch the host sidecar when it exits with the restart code (75).
 * First launch opens the window; relaunches set MINI_APP_SKIP_WINDOW=1.
 *
 * Usage:
 *   node scripts/run-host-loop.mjs -- node --experimental-strip-types packages/shell/src/dev.ts
 *   node scripts/run-host-loop.mjs -- node --import tsx path/to/dev.ts
 */
import { spawn } from 'node:child_process'

const RESTART = 75
const sep = process.argv.indexOf('--')
const command = sep >= 0 ? process.argv.slice(sep + 1) : process.argv.slice(2)
if (command.length === 0) {
  console.error('run-host-loop: missing command after --')
  process.exit(2)
}

let skipWindow = process.env.MINI_APP_SKIP_WINDOW === '1'

function run() {
  const env = { ...process.env }
  if (skipWindow) env.MINI_APP_SKIP_WINDOW = '1'
  else delete env.MINI_APP_SKIP_WINDOW

  const child = spawn(command[0], command.slice(1), {
    env,
    stdio: 'inherit',
    windowsHide: true,
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.exit(signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1)
    }
    const status = code ?? 1
    if (status === RESTART) {
      skipWindow = true
      run()
      return
    }
    process.exit(status)
  })
}

run()
