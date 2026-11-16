// Renders a look's scene to files you can open in a browser, and checks the limits.
//
//   node tools/render-look.mjs --list
//   node tools/render-look.mjs <id> <out-dir> [--css "<css>"]
//
// It writes <out-dir>/<id>.svg, the scene alone, and <out-dir>/preview-<id>.html, the scene
// filling the browser window. With --css it also writes <out-dir>/still-<id>.html, the same page
// with your CSS added: use it to freeze a moment for a picture, for example
//   --css ".run{animation:none!important;transform:translateX(110px)!important}"
//
// It exits with 1 when the scene is longer than the 131,072 characters the app takes, or when the
// theme reports "Desktop won't paint". It needs Node 24 or later (tested on Node 26): the look
// files are TypeScript, and Node runs them directly.

import { registerHooks } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const MAX_SCENE = 131072
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Let './pixel' resolve to './pixel.ts', as the plugin host does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context)
      } catch {
        // Not a file: a folder with an index.ts.
        return nextResolve(`${specifier}/index.ts`, context)
      }
    }

    return nextResolve(specifier, context)
  },
})

const args = process.argv.slice(2)
const cssAt = args.indexOf('--css')
const css = cssAt === -1 ? undefined : args.splice(cssAt, 2)[1]
const { LOOKS } = await import(pathToFileURL(join(root, 'hooks/looks/index.ts')).href)

const size = look => Object.values(look.scenes)[0]?.source.length ?? 0
const isUnpainted = look => (look.problems ?? []).some(line => line.startsWith("Desktop won't paint"))

if (args[0] === '--list' || args.length < 2) {
  LOOKS.forEach((look, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${look.id.padEnd(12)} scene ${String(size(look)).padStart(7)} chars  contrast notes ${look.problems?.length ?? 0}`)
  })
  console.log(`\nA scene must stay under ${MAX_SCENE} characters. Usage: node tools/render-look.mjs <id> <out-dir> [--css "<css>"]`)
  process.exit(args[0] === '--list' ? 0 : 1)
}

const [id, out] = args
const look = LOOKS.find(l => l.id === id)

if (look === undefined) {
  console.error(`No look named "${id}". Run with --list to see them.`)
  process.exit(1)
}
mkdirSync(out, { recursive: true })
const source = Object.values(look.scenes)[0]?.source ?? ''
const page = extra =>
  `<!doctype html><meta charset=utf-8><style>svg{width:100vw;height:100vh;display:block}${extra}</style><body style="margin:0;background:#000">${source}`

writeFileSync(join(out, `${id}.svg`), source)
writeFileSync(join(out, `preview-${id}.html`), page(''))
if (css !== undefined) {
  writeFileSync(join(out, `still-${id}.html`), page(css))
}
console.log(`${id}: scene ${source.length} of ${MAX_SCENE} characters, ${look.problems?.length ?? 0} contrast notes`)
console.log(`wrote ${join(out, `${id}.svg`)} and ${join(out, `preview-${id}.html`)}${css === undefined ? '' : ` and still-${id}.html`}`)

if (source.length > MAX_SCENE || isUnpainted(look)) {
  console.error(source.length > MAX_SCENE ? 'The scene is too long for the app.' : "The theme reports \"Desktop won't paint\".")
  process.exit(1)
}
