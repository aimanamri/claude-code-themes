// The drawing toolkit, part 2: sky bands, the veil behind the chat text, and landmark placement.
//
// The app draws a scene with `preserveAspectRatio="xMidYMid slice"`, so the scene fills the window
// and its edges are cropped. A window narrower than the scene (aspect under 1.6) shows all the
// height and only part of the width. A wider window shows all the width and only part of the
// height. Landmarks therefore cannot sit at fixed scene positions. Each look describes where its
// landmarks go for a given window shape, and `layout` turns that into CSS for a set of shapes.

import { Art, GH, GW, H, PX, W } from './art'

// The opening tag of every scene.
export const SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid slice" viewBox="0 0 ${W} ${H}">`

// ---------- sky ----------

// The first row of a band of sky, and its color.
export type Stops = readonly (readonly [number, string])[]

// The sky as horizontal bands of color. In the last four rows before the next band, every other row
// already takes the next color, so the bands blend a little.
export function skyBands(stops: Stops): string {
  const sky = new Art()

  for (let y = 0; y < GH; y++) {
    const band = stops.filter(([first]) => first <= y).length - 1
    const next = stops[band + 1]
    const toGo = next === undefined ? 0 : next[0] - y
    const color = next !== undefined && (toGo === 2 || toGo === 4) ? next[1] : (stops[band]?.[1] ?? '#000000')

    sky.rect(0, y, GW, 1, color)
  }

  return `<g transform="scale(${PX})">${sky.svg()}</g>`
}

// ---------- what part of the scene shows ----------

export type View = {
  // The width of the scene that shows, and its left and right edges, in scene units.
  v: number
  left: number
  right: number
  // The first scene row that shows when the window is as wide as `high`.
  top: number
  // A phone is narrow and has no sidebar, so every landmark is drawn in and shrunk.
  phone: boolean
  // The scale for landmarks: smaller in a narrow window, and smallest on a phone.
  s: number
}

// For windows from aspect `low` (the narrowest) up to `high`: what shows, and how big to draw.
export function view(low: number, high: number): View {
  const { v, left, right } = visible(low)
  const phone = low < 0.8
  const rowsShown = Math.min(H, W / high)

  return { v, left, right, top: (H - rowsShown) / 2, phone, s: phone ? 0.45 : Math.min(1, Math.max(0.6, 0.5 + 0.5 * (v / W))) }
}

// For a window of width/height `aspect`: the width of the scene that shows, and its edges.
export function visible(aspect: number): { v: number; left: number; right: number } {
  const v = Math.min(W, Math.round(H * aspect))
  const left = (W - v) / 2
  const right = left + v

  return { v, left, right }
}

// ---------- the veil ----------

// The conversation sits in the middle of the window, over the busiest part of the scene. A veil
// fades the middle toward `color` so the words stay readable, and leaves the edges clear for the
// landmarks. It is clear at the left (where the app's sidebar is) until 18% of the visible width,
// reaches its strength by 32%, holds to 78%, and is gone by 88%.
export function scrimGradient(color: string): string {
  const stops: [number, number][] = [[0, 0], [0.18, 0], [0.32, 0.62], [0.78, 0.62], [0.88, 0], [1, 0]]
  const stop = ([at, alpha]: [number, number]): string => `<stop offset="${at}" stop-color="${color}" stop-opacity="${alpha}"/>`

  return `<linearGradient id="g-veil" x1="0" x2="1">${stops.map(stop).join('')}</linearGradient>`
}

export const SCRIM = `<g class="at-veil"><rect width="${W}" height="${H}" fill="url(#g-veil)"/></g>`

// ---------- placing landmarks ----------

// Where one landmark goes: x and y in scene units, and a scale. The landmark is drawn around its
// own origin, usually its foot, and is moved and scaled there.
export type Spot = readonly [x: number, y: number, scale: number]

// Upper edges of the window shapes the layout tells apart, from the widest to the narrowest.
const SHAPES = [2.4, 2.0, 1.7, 1.45, 1.25, 1.05, 0.9, 0.75, 0.6, 0.45]
const WIDEST = 3
const NARROWEST = 0.3

const whole = (n: number): string => n.toFixed(0)
const attr = ([x, y, s]: Spot): string => `translate(${whole(x)} ${whole(y)}) scale(${s.toFixed(2)})`
const rule = ([x, y, s]: Spot): string => `transform: translate(${whole(x)}px, ${whole(y)}px) scale(${s.toFixed(2)});`

// The veil's CSS for a window no narrower than `low`: stretched over the visible width. On a phone
// the words run from edge to edge, so the veil is three times as wide and only its even middle shows.
function veilCss(low: number): string {
  const { v, left } = visible(low)
  const phone = low < 0.8
  const x = phone ? left - v : left
  const stretch = phone ? (3 * v) / W : v / W

  return `.at-veil { transform: translate(${whole(x)}px, 0px) scale(${stretch.toFixed(3)}, 1); opacity: ${phone ? 0.75 : 1}; }`
}

// `spots(low, high)` says where each landmark goes for windows with aspect from `low` up to
// `high`. Plan for `low`, the narrowest of them, so nothing is cropped in the whole range.
// Returns the CSS to put in the scene's <style>, and `placed(name, svg)`, which wraps a landmark in
// its group. The group also carries the position for a 16:10 window, for a viewer that reads no CSS.
export function layout<K extends string>(
  spots: (low: number, high: number) => Record<K, Spot>,
): { css: string; placed: (name: K, inner: string) => string } {
  const rulesFor = (at: Record<K, Spot>): string => (Object.keys(at) as K[]).map(name => `.at-${name} { ${rule(at[name])} }`).join(' ')
  const css = [`  ${rulesFor(spots(SHAPES[0] ?? 2.4, WIDEST))} ${veilCss(SHAPES[0] ?? 2.4)}`]

  SHAPES.forEach((high, i) => {
    css.push(`  @media (max-aspect-ratio: ${Math.round(high * 100)}/100) { ${rulesFor(spots(SHAPES[i + 1] ?? NARROWEST, high))} ${veilCss(SHAPES[i + 1] ?? NARROWEST)} }`)
  })
  const home = spots(1.4, 1.6)

  return { css: css.join('\n'), placed: (name, inner) => `<g class="at-${name}" transform="${attr(home[name])}">${inner}</g>` }
}
