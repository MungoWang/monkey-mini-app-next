#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const lefthook = join(root, 'node_modules', '.bin', 'lefthook')

function skip(reason) {
  console.error(`lefthook install skipped: ${reason}`)
  process.exit(0)
}

if (!existsSync(join(root, '.git'))) skip('no git metadata in this checkout')
if (!existsSync(lefthook)) skip('lefthook is not installed')

const result = spawnSync(lefthook, ['install'], {
  cwd: root,
  encoding: 'utf8',
  stdio: 'inherit',
})

if (result.error !== undefined || result.status !== 0) {
  skip('git hooks could not be installed')
}
