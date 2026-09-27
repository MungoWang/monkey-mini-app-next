import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildPanelPage } from './panel-page.ts'

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')

/** Write the panel SPA. Host serves these files. It does not compile them. */
const page = await buildPanelPage()
await mkdir(outDir, { recursive: true })
await writeFile(path.join(outDir, 'panel.html'), page.html)
await writeFile(path.join(outDir, 'panel.js'), page.script)
console.log(outDir)
