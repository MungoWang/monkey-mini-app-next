#!/usr/bin/env node
/**
 * Pack monorepo source for another machine (no node_modules / build caches).
 * Uses git's exclude rules so the archive matches a clean source tree plus
 * uncommitted source. Writes under artifacts/source-pack/.
 *
 * Run as: pnpm pack:source
 */
import { execFileSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const outDir = join(root, 'artifacts', 'source-pack')
const setupName = 'SOURCE-PACK.md'

function shellVersion() {
  return JSON.parse(readFileSync(join(root, 'packages/shell/package.json'), 'utf8')).version
}

function listSourceFiles() {
  const raw = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
  })
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(path => !path.endsWith('.tsbuildinfo'))
    .filter(path => path !== setupName)
}

function archiveBytes(path) {
  return statSync(path).size
}

const version = shellVersion()
const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '')
const baseName = `mohou-mini-app-${version}-source`
const archiveName = `${baseName}-${stamp}.tgz`
const archivePath = join(outDir, archiveName)
const readmePath = join(outDir, 'README.md')
const setupPath = join(root, setupName)

mkdirSync(outDir, { recursive: true })

const files = listSourceFiles()
if (files.length === 0) throw new Error('no source files to pack')

const setup = `# Mohou monorepo source pack

Version: ${version}
Packed: ${new Date().toISOString()}
Files: ${files.length}

## Unpack

\`\`\`sh
mkdir -p mohou-mini-app && tar -xzf ${archiveName} -C mohou-mini-app
cd mohou-mini-app
\`\`\`

## Run on the other machine

Needs **Node.js ^22.19 || >=24**, **pnpm 11.7**, and (for the window) **Rust + cargo**.

\`\`\`sh
pnpm install
pnpm build:panel
pnpm build:window
pnpm dev:host
\`\`\`

Optional ship tracks after install:

\`\`\`sh
pnpm dist:local   # folder app under artifacts/local-app
pnpm dist:app     # macOS Mohou.app + dmg (darwin only)
\`\`\`

This archive excludes \`node_modules\`, \`artifacts/\`, Cargo \`target/\`, coverage, vendor, and other gitignored build output. It does not embed secrets (\`.env\` stays out via gitignore).
`

const hadSetup = existsSync(setupPath)
writeFileSync(setupPath, setup)

const listPath = join(outDir, '.file-list.txt')
writeFileSync(listPath, `${[...files, setupName].join('\n')}\n`)
rmSync(archivePath, { force: true })

try {
  const tar = spawnSync('tar', ['-czf', archivePath, '-T', listPath], {
    cwd: root,
    encoding: 'utf8',
  })
  if (tar.status !== 0) {
    throw new Error(`tar failed: ${tar.stderr || tar.stdout || tar.status}`)
  }
} finally {
  rmSync(listPath, { force: true })
  if (!hadSetup) rmSync(setupPath, { force: true })
}

if (!existsSync(archivePath)) throw new Error(`archive missing: ${archivePath}`)

const mb = (archiveBytes(archivePath) / (1024 * 1024)).toFixed(1)

writeFileSync(
  readmePath,
  `# Source pack

| | |
| --- | --- |
| Archive | \`${archiveName}\` |
| Size | ${mb} MB |
| Files | ${files.length} |
| Shell version | ${version} |

Unpack and run steps are inside the archive as \`${setupName}\`.

\`\`\`sh
tar -tzf ${archiveName} | head
mkdir -p mohou-mini-app && tar -xzf ${archiveName} -C mohou-mini-app
cat mohou-mini-app/${setupName}
\`\`\`
`,
)

console.log(`pack:source ${files.length} files → ${archivePath} (${mb} MB)`)
console.log(`readme: ${readmePath}`)
