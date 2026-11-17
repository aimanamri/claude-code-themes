// Writes an HTML page that shows every look in a 16:9 grid, for the preview image of the theme
// listing on buildwithclaude.com (a PNG, ideally 16:9 and under 3 MB).
//
//   node tools/make-preview.mjs <out-dir>
//
// It uses the preview-<id>.svg files in the repo root, in the order of `LOOKS`. Then take a picture
// with headless Chrome (on macOS):
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1600,900 --screenshot=assets/preview.png file://<out-dir>/preview-grid.html
// It needs Node 24 or later (tested on Node 26): the look files are TypeScript, and Node runs them.

import { registerHooks } from 'node:module'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Let './pixel' resolve to './pixel.ts', as the plugin host does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context)
      } catch {
        return nextResolve(`${specifier}/index.ts`, context)
      }
    }

    return nextResolve(specifier, context)
  },
})

const out = process.argv[2]

if (out === undefined) {
  console.error('Usage: node tools/make-preview.mjs <out-dir>')
  process.exit(1)
}
const { LOOKS } = await import(pathToFileURL(join(root, 'hooks/looks/index.ts')).href)

mkdirSync(out, { recursive: true })
for (const look of LOOKS) {
  copyFileSync(join(root, `preview-${look.id}.svg`), join(out, `preview-${look.id}.svg`))
}
// A 3 by 3 grid: a title across two cells, then one cell for each look.
const tiles = LOOKS.map(look => `<figure><img src="preview-${look.id}.svg" alt=""><figcaption>${look.label}</figcaption></figure>`)
const html = `<!doctype html><meta charset=utf-8><style>
body{margin:0;width:1600px;height:900px;background:#0b0916;font-family:ui-monospace,Menlo,monospace;color:#f4f2fb}
.grid{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:6px;width:1600px;height:900px;box-sizing:border-box;padding:6px}
figure{margin:0;position:relative;overflow:hidden;background:#000}
img{width:100%;height:100%;object-fit:cover;display:block}
figcaption{position:absolute;left:10px;bottom:8px;padding:2px 8px;background:#0b0916cc;font-size:20px}
.title{grid-column:span 2;display:flex;flex-direction:column;justify-content:center;padding:0 48px;background:#110e1f}
h1{margin:0 0 14px;font-size:58px;color:#e9b44c}p{margin:0;font-size:26px;line-height:1.4;color:#cfc6d2}
</style><div class=grid><div class=title><h1>looks-malaysia</h1><p>Pixel-art looks of Malaysia for the Claude desktop and mobile apps. Moving backdrops and chat colors.</p></div>${tiles.join('')}</div>`

writeFileSync(join(out, 'preview-grid.html'), html)
console.log(`wrote ${join(out, 'preview-grid.html')} with ${LOOKS.length} looks`)
