import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { compilePanelStylesheet } from '@mohou/host'
import * as esbuild from 'esbuild'

const require = createRequire(import.meta.url)

/** Panel document Shell attaches to the loopback listener. */
export async function buildPanelPage(): Promise<{ html: string; script: string }> {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const [built, css] = await Promise.all([
    esbuild.build({
      absWorkingDir: here,
      entryPoints: ['browser.tsx'],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      write: false,
      jsx: 'automatic',
      alias: {
        react: require.resolve('react'),
        'react-dom/client': require.resolve('react-dom/client'),
        'react/jsx-runtime': require.resolve('react/jsx-runtime'),
      },
    }),
    compilePanelStylesheet(path.resolve(here, '../../panel/src')),
  ])
  const script = built.outputFiles[0]?.text
  if (script === undefined) throw new Error('panel script produced no module')
  return {
    html: `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mohou</title>
<style id="mma-panel">${css.replaceAll('</', '<\\/')}</style>
</head>
<body>
<div id="root"></div>
<script type="module" src="/panel.js"></script>
</body>
</html>`,
    script,
  }
}
