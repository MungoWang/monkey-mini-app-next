#!/usr/bin/env node
/**
 * Generate the mini-app UI reference from component source (TypeScript AST + JSDoc)
 * → skills/mohou-mini-app/references/{catalog.md,contracts/*.md} + packages/app/ui/ai/catalog.json.
 *
 * Inputs: packages/app/ui/src/**, packages/app/ui/catalog-families.json,
 *         packages/app/ui/examples/**
 * Writes: skills/mohou-mini-app/references/**, packages/app/ui/ai/catalog.json,
 *         skills/mohou-mini-app/templates/** (copied from packages/app/templates/src)
 * Side effects: repo tracked files — commit the regenerated diff
 * Run as: pnpm gen:skill
 *
 * Discovery is from source: blocks/composites/products from index.ts, L1 primitives from components/.
 * The look pages are hand-written and outside this generator.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { loadFamilies } from "./families.mjs"
import { buildRecords } from "./extract.mjs"
import { loadExamples, writeSkillExamples } from "./examples.mjs"
import { renderCatalog, renderCatalogJson, renderContract, renderFamilyContract } from "./render.mjs"
import { generateThemeDoc } from "./theme.mjs"
import { copyTemplates } from "./templates.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..")
const uiRoot = path.join(repoRoot, "packages/app/ui")
const srcRoot = path.join(uiRoot, "src")
const skillRef = path.join(repoRoot, "skills/mohou-mini-app/references")
const examplesRoot = path.join(uiRoot, "examples")
const contractsDir = path.join(skillRef, "contracts")
const catalogMdPath = path.join(skillRef, "catalog.md")
const catalogJsonPath = path.join(uiRoot, "ai/catalog.json")

async function main() {
 const { families } = loadFamilies(path.join(uiRoot, "catalog-families.json"))
 const familyNames = new Set(families.map((f) => f.name))
 const { components, primitives } = buildRecords({ repoRoot, uiRoot, srcRoot })

 // One contract per file: an L1 primitive must not overwrite a block/product doc.
 const used = new Set(components.map((c) => c.slug))
 for (const f of primitives) {
 if (used.has(f.slug)) f.slug = `l1-${f.slug}`
 used.add(f.slug)
 }

 const examples = loadExamples(examplesRoot)
 const subjects = new Map()
 for (const c of components) {
 subjects.set(c.name, c.slug)
 for (const p of c.parts ?? []) subjects.set(p.name, c.slug)
 for (const p of c.helpers ?? []) subjects.set(p.name, c.slug)
 }
 for (const f of primitives) {
 subjects.set(f.root, f.slug)
 for (const p of f.parts ?? []) subjects.set(p.name, f.slug)
 }
 const { bySubject, missingSubject } = writeSkillExamples({
 skillRef,
 examples,
 sharedRoot: path.join(examplesRoot, "shared"),
 examplesRoot,
 subjectSlugs: new Set(subjects.keys()),
 })
 // resolve each record's examples through its slug
 const bySlug = new Map()
 for (const [name, slug] of subjects) {
 const list = bySubject.get(name)
 if (!list) continue
 const bucket = bySlug.get(slug) ?? []
 for (const e of list) if (!bucket.some((x) => x.href === e.href)) bucket.push(e)
 bySlug.set(slug, bucket)
 }

 fs.mkdirSync(contractsDir, { recursive: true })
 for (const file of fs.readdirSync(contractsDir)) {
 if (file.endsWith(".md")) fs.unlinkSync(path.join(contractsDir, file))
 }
 for (const c of components) {
 fs.writeFileSync(path.join(contractsDir, `${c.slug}.md`), renderContract(c, bySlug.get(c.slug) ?? []))
 }
 for (const f of primitives) {
 fs.writeFileSync(path.join(contractsDir, `${f.slug}.md`), renderFamilyContract(f, bySlug.get(f.slug) ?? []))
 }

 // One flat list of every documented component, for the catalog and the registry.
 const entries = [
 ...components.map((c) => ({ ...c })),
 ...primitives.map((f) => ({
 name: f.root,
 slug: f.slug,
 file: f.file,
 componentType: f.componentType,
 primitive: f.primitive,
 family: f.family,
 summary: f.summary,
 when: f.when,
 parts: f.parts,
 helpers: f.helpers,
 })),
 ]

 const badFamily = entries.filter((e) => !familyNames.has(e.family))
 if (badFamily.length) {
 console.error(
 `\n@family missing or unknown on ${badFamily.length}/${entries.length} component(s) — vocabulary: ${[...familyNames].join(" | ")}`
)
 for (const e of badFamily.slice(0, 40)) {
 console.error(` ${e.name} (${e.file}) → "${e.family || ""}"`)
 }
 if (badFamily.length > 40) console.error(` … ${badFamily.length - 40} more`)
 }

 if (missingSubject.length) {
 console.warn(
 `\n[gen:skill] WARNING @exampleOf does not match any component (${missingSubject.length}):\n` +
 missingSubject.map((m) => `  - ${m}`).join("\n") +
 "\n",
 )
 }
 fs.writeFileSync(catalogMdPath, renderCatalog(entries, families))
 fs.mkdirSync(path.dirname(catalogJsonPath), { recursive: true })
 fs.writeFileSync(
 catalogJsonPath,
 JSON.stringify(renderCatalogJson(entries, families), null, 2) + "\n"
)

 const tokenCount = generateThemeDoc()
 const templateCount = copyTemplates(repoRoot)
 const { syncSkillIntoShell } = await import("../../sync/skill-into-shell.mjs")
 const synced = syncSkillIntoShell(repoRoot)
 const withTypes = components.filter((c) => c.types?.length).length
 const parts = primitives.reduce((n, f) => n + f.parts.length + f.helpers.length, 0)
 console.log(
 `mohou-mini-app skill: ${entries.length} components in ${families.length} families ` +
 `(${components.length} contracts, ${withTypes} with related types; ${primitives.length} L1 files, ${parts} parts) ` +
 `→ skills/mohou-mini-app/references/ (+ theme.md: ${tokenCount} tokens, ${templateCount} template files); ` +
 `shell skill @ ${synced.shellVersion}`
)
 if (badFamily.length) process.exitCode = 1
}

await main()
