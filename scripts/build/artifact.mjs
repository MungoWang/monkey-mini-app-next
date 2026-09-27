#!/usr/bin/env node
/**
 * Release window, panel bundle, and a local run directory.
 *
 * Inputs: packages/shell/package.json, packages/shell/dist, the Tauri crate
 * Writes: artifacts/Mohou-<version>-<platform>/
 * Side effects: runs pnpm build:panel and cargo build --release
 * Run as: pnpm build:artifact
 */
import { execFileSync } from 'node:child_process'
import { chmodSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const version = readVersion(join(root, 'packages/shell/package.json'))
const platform = process.platform
const builtName = platform === 'win32' ? 'mini-app-window.exe' : 'mini-app-window'
const productName = platform === 'win32' ? 'Mohou.exe' : 'Mohou'
if (platform !== 'darwin' && platform !== 'win32') {
  console.error(`panel window is not implemented on ${platform}`)
  process.exit(1)
}

execFileSync('pnpm', ['build:panel'], { cwd: root, stdio: 'inherit' })
execFileSync('cargo', ['build', '--release', '--manifest-path', 'packages/launcher/tauri/Cargo.toml'], {
  cwd: root,
  stdio: 'inherit',
})

const out = join(root, 'artifacts', `Mohou-${version}-${platform}`)
mkdirSync(out, { recursive: true })
cpSync(join(root, 'packages/launcher/tauri/target/release', builtName), join(out, productName))
cpSync(join(root, 'packages/shell/dist/panel.html'), join(out, 'panel.html'))
cpSync(join(root, 'packages/shell/dist/panel.js'), join(out, 'panel.js'))
writeFileSync(join(out, 'VERSION'), `${version}\n`)
if (platform === 'win32') writeFileSync(join(out, 'run.cmd'), windowsLauncher(root, productName))
else {
  const run = join(out, 'run')
  writeFileSync(run, unixLauncher(root, productName))
  chmodSync(run, 0o755)
}
console.log(out)

function readVersion(file) {
  const parsed = JSON.parse(readFileSync(file, 'utf8'))
  if (typeof parsed.version !== 'string' || parsed.version.length === 0) {
    throw new Error(`missing version in ${file}`)
  }
  return parsed.version
}

function unixLauncher(repo, binary) {
  return `#!/bin/sh
set -eu
here=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
export MINI_APP_PANEL="$here"
export MINI_APP_WINDOW="$here/${binary}"
cd ${shellQuote(repo)}
exec node --experimental-strip-types packages/shell/src/dev.ts
`
}

function windowsLauncher(repo, binary) {
  return `@echo off
set MINI_APP_PANEL=%~dp0
set MINI_APP_WINDOW=%~dp0${binary}
cd /d "${repo}"
node --experimental-strip-types packages\\shell\\src\\dev.ts
`
}

function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`
}
