import fs from 'node:fs'
import path from 'node:path'

/** Author samples. `gen:skill` copies this tree into the skill. */
export function templateSource(repoRoot) {
  return path.join(repoRoot, 'packages/app/templates/src')
}

export function templateDest(repoRoot) {
  return path.join(repoRoot, 'skills/mohou-mini-app/templates')
}

function relativeFiles(dir) {
  const found = []
  const walk = (current) => {
    if (!fs.existsSync(current)) return
    for (const name of fs.readdirSync(current)) {
      const abs = path.join(current, name)
      const rel = path.relative(dir, abs)
      if (fs.statSync(abs).isDirectory()) walk(abs)
      else found.push(rel.split(path.sep).join('/'))
    }
  }
  walk(dir)
  found.sort()
  return found
}

function pruneEmpty(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name)
    if (fs.statSync(abs).isDirectory()) pruneEmpty(abs)
  }
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
}

/** Copy the package samples onto the skill tree. Returns the file count. */
export function copyTemplates(repoRoot) {
  const source = templateSource(repoRoot)
  const dest = templateDest(repoRoot)
  const files = relativeFiles(source)
  fs.mkdirSync(dest, { recursive: true })
  const keep = new Set(files)
  for (const rel of files) {
    const to = path.join(dest, rel)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.copyFileSync(path.join(source, rel), to)
  }
  for (const rel of relativeFiles(dest)) {
    if (!keep.has(rel)) fs.rmSync(path.join(dest, rel))
  }
  pruneEmpty(dest)
  return files.length
}

/** Paths whose skill copy does not match the package source. */
export function templateDrift(repoRoot) {
  const source = templateSource(repoRoot)
  const dest = templateDest(repoRoot)
  const from = new Set(relativeFiles(source))
  const to = new Set(relativeFiles(dest))
  const drift = []
  for (const rel of from) {
    if (!to.has(rel)) {
      drift.push(`${rel} missing from the skill`)
      continue
    }
    const left = fs.readFileSync(path.join(source, rel))
    const right = fs.readFileSync(path.join(dest, rel))
    if (!left.equals(right)) drift.push(`${rel} differs`)
  }
  for (const rel of to) {
    if (!from.has(rel)) drift.push(`${rel} is only in the skill`)
  }
  return drift
}
