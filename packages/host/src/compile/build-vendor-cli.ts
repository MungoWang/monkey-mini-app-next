import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildVendorFiles } from './build-vendor.ts'

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../vendor')
const written = await buildVendorFiles({ outDir })
for (const file of written) console.log(file)
