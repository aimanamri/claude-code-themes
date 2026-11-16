import type { LookSpec } from './types'

import { makeColors } from '../make-colors.js'
import { Art, calm, GH, glow, grad, GW, hash, layout, MOTION_CSS, PX, px, reflection, ripples, SCRIM, scrimGradient, seeded, skyBands, SVG_OPEN, view, type Spot, type Stops } from '../kit'

// The Terengganu coast by day, drawn as pixel art, looking across the sea to the shore. On the
// right the Crystal Mosque, its faceted glass dome catching the sun and its minaret tall beside
// it, with coconut palms and a leatherback turtle on the sand, the state's best-known visitor.
// In the gap on the left the Floating Mosque on the water, a fishing boat with a painted prow
// beneath the sun, and a far island on the horizon. A wau kite flies, seagulls cross the sky and
// the surf runs in, over a bright blue sky and a turquoise sea. A light look. The accent is the
// deep teal of the sea, readable on a light page; red keeps meaning danger.
const { theme, problems } = makeColors({
  label: 'Terengganu',
  only: 'light',
  roles: {
    accent: '#0e8a8a',
    danger: '#c0392b',
    success: '#2f8f4a',
    warning: '#b7861a',
    pro: '#8a5ac8',
  },
  light: {
    gray: {
      anchors: {
        'surface-0': '#eaf3f6',
        'surface-1': '#f2f8fa',
        'surface-2': '#f8fbfc',
        'surface-3': '#f8fbfc',
        'text-primary': '#12232b',
        'text-secondary': '#3a4f5a',
        'text-muted': '#546874',
      },
    },
  },
})

// The waterline, in art pixels: the shore stands on it, the sea runs below it.
const SHORE = 152

// ---------- sky ----------

// Blue overhead, paling toward the horizon where the haze turns warm.
const SKY: Stops = [
  [0, '#4aa8ec'],
  [20, '#62b8f2'],
  [40, '#7cc6f4'],
  [60, '#98d4f6'],
  [80, '#a8d8f4'],
  [100, '#b8e0f6'],
  [120, '#cce9f6'],
  [135, '#def2f6'],
  [148, '#f6f4e0'],
]

// The sun, a disc and its glow, with two sets of rays shown in turn so it seems to shimmer.
function sun(): string {
  const core = new Art()
  const raysA = new Art()
  const raysB = new Art()

  core.disc(0, 0, 6, '#fff4b0')
  core.disc(0, 0, 4, '#ffe066')
  for (let k = 0; k < 8; k++) {
    for (const [rays, offset] of [[raysA, 0], [raysB, Math.PI / 8]] as const) {
      const angle = (k * Math.PI) / 4 + offset

      for (let r = 9; r <= 13; r++) {
        rays.set(Math.round(Math.cos(angle) * r), Math.round(Math.sin(angle) * r), '#ffe680')
      }
    }
  }

  return px(glow(0, 0, 28, 28, 'g-sun', 0.7) + core.svg()) + px(raysA.svg(), 'ray-a') + px(raysB.svg(), 'ray-b')
}

// A puffy cloud: three bumps on a flat base, shaded underneath.
function cloudAt(a: Art, cx: number, cy: number, scale: number): void {
  const r = (n: number): number => Math.round(n * scale)

  a.disc(cx - r(7), cy, r(4), '#ffffff')
  a.disc(cx, cy - r(3), r(5), '#ffffff')
  a.disc(cx + r(8), cy, r(4), '#ffffff')
  a.rect(cx - r(11), cy, r(24), r(4), '#ffffff')
  a.rect(cx - r(11), cy + r(4), r(24), 1, '#d4e8f4')
}

function clouds(): string {
  const a = new Art()

  cloudAt(a, 40, 34, 1)
  cloudAt(a, 120, 58, 1.2)
  cloudAt(a, 205, 26, 0.9)
  cloudAt(a, 272, 62, 1.1)

  return px(`<g class="cloud">${a.svg()}</g>`)
}

// Seagulls: wings up, then wings level, shown in turn.
function gulls(): string {
  const up = new Art()
  const level = new Art()

  for (const [x, y] of [[0, 0], [14, 6], [-12, 9]] as const) {
    for (const [dx, dy] of [[-2, 0], [-1, -1], [1, -1], [2, 0]] as const) {
      up.set(x + dx, y + dy, '#ffffff')
    }
    up.set(x, y, '#586878')
    for (const dx of [-2, -1, 1, 2]) {
      level.set(x + dx, y, '#ffffff')
    }
    level.set(x, y, '#586878')
  }

  return px(up.svg(), 'gull-a') + px(level.svg(), 'gull-b')
}

// A wau, the Terengganu kite: a diamond in four colors on a long tail.
function wau(): string {
  const a = new Art()
  const tail = new Art()

  for (let dy = -6; dy <= 6; dy++) {
    const hw = Math.round(5 * (1 - Math.abs(dy) / 7))

    for (let dx = -hw; dx <= hw; dx++) {
      a.set(dx, dy, dy < 0 ? (dx < 0 ? '#e63946' : '#ffd23a') : dx < 0 ? '#2a6fdb' : '#2ea84a')
    }
  }
  a.rect(0, -6, 1, 13, '#ffffff')
  for (let t = 0; t < 18; t++) {
    tail.set(Math.round(Math.sin(t * 0.9) * 1.5), 7 + t, t % 4 === 0 ? '#e63946' : '#586878')
  }

  return px(`<g class="kite">${a.svg() + tail.svg()}</g>`)
}

// ---------- the far island and the shore ----------

function islands(): string {
  const a = new Art()

  for (const [cx, rx, h] of [[150, 40, 11], [200, 26, 7], [118, 18, 5]] as const) {
    for (let x = -rx; x <= rx; x++) {
      const top = Math.round(h * Math.max(0, 1 - (x / rx) ** 2) ** 0.7)

      for (let y = 0; y <= top; y++) {
        a.set(cx + x, SHORE - 3 - y, y === top ? '#a8d4cc' : '#8cc0b8')
      }
    }
  }

  return px(a.svg())
}

// The beach along the waterline, with a damp edge where the surf reaches.
function beach(): string {
  const a = new Art()

  a.rect(0, SHORE - 2, GW, 5, '#f4e2b4')
  a.rect(0, SHORE + 2, GW, 1, '#e2c88a')
  for (let x = 0; x < GW; x += 7) {
    a.set(x + Math.floor(hash(x, 1) * 5), SHORE - 1, '#e8d09a')
  }

  return px(a.svg())
}

// ---------- coconut palms (foot of the first at its origin) ----------

function palm(trunk: Art, fronds: Art, cx: number, h: number, lean: number): void {
  for (let t = 0; t < h; t++) {
    const x = cx + Math.round(lean * (t / h) ** 2)

    trunk.set(x, -t - 1, t % 4 === 3 ? '#6a4a2a' : '#9a7a54')
    trunk.set(x + 1, -t - 1, '#6a4a2a')
  }
  const tx = cx + lean
  const ty = -h - 1

  for (let k = 0; k < 9; k++) {
    const angle = (k / 9) * Math.PI * 2

    for (let d = 1; d <= 10; d++) {
      const x = tx + Math.round(Math.cos(angle) * d)
      const y = ty + Math.round(Math.sin(angle) * d * 0.45 + d * d * 0.05)

      fronds.set(x, y, d > 6 ? '#48c060' : d > 3 ? '#2f9f4f' : '#1e7a3a')
      if (d > 2) {
        fronds.set(x, y + 1, '#1e7a3a')
      }
    }
  }
  fronds.rect(tx - 1, ty + 1, 3, 2, '#6a4a2a')
}

function palms(spec: readonly (readonly [number, number, number])[]): string {
  const trunks = new Art()
  const fronds = new Art()

  for (const [cx, h, lean] of spec) {
    palm(trunks, fronds, cx, h, lean)
  }

  return px(trunks.svg()) + px(`<g class="palm">${fronds.svg()}</g>`)
}

// ---------- the Crystal Mosque (centre of its foot at the origin) ----------

// A dome of glass: diagonal lattice lines over a pale blue, lit along its left side.
function dome(a: Art, cx: number, baseY: number, rx: number, ry: number, base: string, line: string, light: string): void {
  for (let y = 0; y < ry; y++) {
    const hw = Math.round(rx * Math.sqrt(1 - (y / ry) ** 2))

    for (let x = -hw; x <= hw; x++) {
      const lattice = (x + y) % 4 === 0 || (x - y) % 4 === 0

      a.set(cx + x, baseY - y - 1, lattice ? line : x < -hw / 3 ? light : base)
    }
  }
}

function crystalMosque(): string {
  const body = new Art()
  const glass = new Art()
  const gold = new Art()

  // Steps, the hall with its rows of blue glass, and the shaded right side.
  body.rect(-28, -2, 57, 2, '#a8bcc8')
  body.rect(-26, -4, 53, 2, '#d4e0e8')
  body.rect(-22, -16, 45, 12, '#eef5f9')
  body.rect(-22, -16, 45, 1, '#8aa4b4')
  body.rect(-22, -16, 1, 12, '#a8bcc8')
  body.rect(21, -16, 2, 12, '#a8bcc8')
  for (let x = -20; x <= 18; x += 4) {
    glass.rect(x, -14, 3, 9, '#6cb4d4')
    glass.rect(x, -14, 3, 1, '#b4e0f0')
  }
  // The big dome, the two small ones, and the finial.
  dome(glass, 0, -16, 13, 11, '#b4dcee', '#5a9fc0', '#dff2fa')
  dome(glass, -15, -16, 6, 5, '#c4e4f2', '#6aa8c8', '#e8f6fb')
  dome(glass, 15, -16, 6, 5, '#c4e4f2', '#6aa8c8', '#e8f6fb')
  gold.rect(0, -33, 1, 5, '#e8c04a')
  gold.rect(-1, -28, 3, 1, '#e8c04a')
  // The minaret: a slender shaft with a glass stripe, two balconies and a golden crown.
  body.rect(26, -62, 3, 58, '#e4eef3')
  body.rect(28, -62, 1, 58, '#8aa4b4')
  glass.rect(27, -60, 1, 54, '#6cb4d4')
  body.rect(24, -44, 7, 2, '#a8bcc8')
  body.rect(24, -54, 7, 2, '#a8bcc8')
  dome(gold, 27, -62, 3, 4, '#e8c04a', '#c8962a', '#fff0a0')
  gold.rect(27, -70, 1, 6, '#e8c04a')

  return px(glow(0, -20, 40, 30, 'g-sun', 0.35) + body.svg() + glass.svg() + gold.svg())
}

// ---------- the Floating Mosque (centre of its platform at the origin, on the water) ----------

function floatingMosque(): string {
  const body = new Art()
  const roof = new Art()
  const gold = new Art()

  body.rect(-30, -2, 61, 3, '#b8c8d0')
  body.rect(-24, -13, 49, 11, '#f4f9fb')
  body.rect(-24, -13, 49, 1, '#8aa4b4')
  body.rect(-24, -13, 1, 11, '#a8bcc8')
  body.rect(23, -13, 2, 11, '#a8bcc8')
  for (let x = -22; x <= 20; x += 5) {
    body.rect(x, -10, 3, 8, '#4aa8b8')
    body.set(x + 1, -11, '#4aa8b8')
  }
  dome(roof, 0, -13, 10, 9, '#2eb8ae', '#1a8f88', '#6fe0d4')
  for (const cx of [-19, -9, 9, 19]) {
    dome(roof, cx, -13, 4, 4, '#2eb8ae', '#1a8f88', '#6fe0d4')
  }
  gold.rect(0, -27, 1, 4, '#e8c04a')
  for (const mx of [-29, 29]) {
    body.rect(mx, -34, 2, 34, '#eef4f8')
    body.rect(mx + 1, -34, 1, 34, '#8aa4b4')
    dome(roof, mx, -34, 2, 3, '#2eb8ae', '#1a8f88', '#6fe0d4')
    gold.rect(mx, -40, 1, 3, '#e8c04a')
  }

  return px(glow(0, -10, 36, 18, 'g-sun', 0.3) + body.svg() + roof.svg() + gold.svg())
}

// ---------- a fishing boat with a painted prow (centred on its waterline) ----------

function boat(): string {
  const a = new Art()

  // The hull in bands of white, red and blue, with a prow that curls up at the bow.
  for (const [y, w, fill] of [[-4, 27, '#ffffff'], [-3, 25, '#f4f1ee'], [-2, 23, '#d93a3a'], [-1, 21, '#2a5fb0'], [0, 19, '#1a2a4a']] as const) {
    a.rect(-Math.floor(w / 2), y, w, 1, fill)
  }
  a.set(14, -5, '#ffffff')
  a.set(15, -6, '#d93a3a')
  a.set(15, -7, '#ffffff')
  a.set(16, -8, '#d93a3a')
  a.set(-13, -5, '#ffffff')
  a.set(-14, -6, '#d93a3a')
  // A small cabin, a mast and a flag.
  a.rect(-6, -9, 8, 5, '#f4e8c8')
  a.rect(-7, -10, 10, 1, '#c8962a')
  a.rect(5, -15, 1, 11, '#6a4a2a')
  a.rect(6, -15, 5, 2, '#d2202f')

  return px(`<g class="rock">${a.svg()}</g>`)
}

// ---------- a leatherback turtle on the sand (centre at the origin) ----------

function turtle(): string {
  const a = new Art()

  // A spit of sand ringed with foam, then a shell with ridges, a head, four flippers and a
  // tiny hatchling beside it.
  for (let y = -10; y <= 10; y++) {
    const hw = Math.round(24 * Math.sqrt(Math.max(0, 1 - (y / 10.5) ** 2)))

    for (let x = -hw; x <= hw; x++) {
      a.set(x, y + 2, Math.abs(y) >= 9 || hw - Math.abs(x) < 1 ? '#ffffff' : y > 6 || hw - Math.abs(x) < 3 ? '#e2c88a' : '#f4e2b4')
    }
  }
  for (let y = -5; y <= 5; y++) {
    const hw = Math.round(4 * Math.sqrt(1 - (y / 6) ** 2))

    for (let x = -hw; x <= hw; x++) {
      a.set(x, y, x % 2 === 0 ? '#4a6a2a' : '#5a7a32')
    }
  }
  a.set(0, -3, '#8aa848')
  a.set(0, 0, '#8aa848')
  a.set(0, 3, '#8aa848')
  a.disc(0, -7, 2, '#a8b86a')
  a.set(-1, -8, '#12232b')
  a.set(1, -8, '#12232b')
  for (const [x, y] of [[-5, -3], [-6, -2], [-7, -1], [5, -3], [6, -2], [7, -1], [-4, 4], [-5, 5], [4, 4], [5, 5]] as const) {
    a.set(x, y, '#7a9a4a')
  }
  a.rect(9, 2, 3, 2, '#5a7a32')
  a.set(12, 2, '#a8b86a')

  return px(a.svg())
}

// ---------- the sea ----------

function sea(): string {
  const a = new Art()

  a.rect(0, SHORE + 3, GW, 13, '#27bcc8')
  a.rect(0, SHORE + 16, GW, 16, '#1fa8bc')
  a.rect(0, SHORE + 32, GW, GH - SHORE - 32, '#1894ac')
  ripples(a, SHORE + 5, SHORE + 16, '#4ad0d8', 2, 0.5)
  ripples(a, SHORE + 16, GH, '#3cb8cc', 3, 0.5)

  return px(a.svg())
}

// The surf along the beach and the sparkles on the water, each in two sets shown in turn.
function surf(): string {
  const foamA = new Art()
  const foamB = new Art()
  const sparkA = new Art()
  const sparkB = new Art()

  for (let x = 0; x < GW; x += 4) {
    ;(x % 8 === 0 ? foamA : foamB).rect(x, SHORE + 3, 3, 1, '#ffffff')
  }
  const rand = seeded(97)

  for (let i = 0; i < 70; i++) {
    ;(i % 2 === 0 ? sparkA : sparkB).set(Math.floor(rand() * GW), SHORE + 6 + Math.floor(rand() * 40), '#e8fbff')
  }

  return px(foamA.svg(), 'foam-a') + px(foamB.svg(), 'foam-b') + px(sparkA.svg(), 'glint-a') + px(sparkB.svg(), 'glint-b')
}

// ---------- layout ----------
//
// Palms and a fishing boat at the left (under the app's sidebar on a desktop), the Floating
// Mosque and the sun in the gap between the sidebar and the conversation, and the Crystal Mosque,
// palms and the turtle past the conversation on the right. Phones have no sidebar, so all of it
// draws in and shrinks.

type Spots = Record<'sun' | 'gulls' | 'wau' | 'palmsL' | 'boat1' | 'floating' | 'crystal' | 'palmsR' | 'boat2' | 'turtle', Spot>

// The pale streaks under what stands on the shore, a little stronger on this bright sea.
const reflect = (columns: readonly (readonly [number, number, string, number])[]): string => reflection(columns, 0.4)

const SHORE_Y = SHORE * PX

function spots(low: number, high: number): Spots {
  const { v, left, right, top, phone, s } = view(low, high)

  return {
    sun: [left + v * (phone ? 0.2 : 0.27), top + 85 * s, s],
    gulls: [left + v * (phone ? 0.5 : 0.5), top + 150 * s, s],
    wau: [right - v * (phone ? 0.18 : 0.05), top + 130 * s, s],
    palmsL: [left + v * (phone ? 0.04 : 0.02), SHORE_Y, s],
    boat1: [left + v * (phone ? 0.2 : 0.115), SHORE_Y + 62 * s, s],
    floating: [left + v * (phone ? 0.4 : 0.235), SHORE_Y + 36 * s, s],
    // The mosque and the turtle stand clear of the veil behind the conversation, which fades out by 88%.
    crystal: [right - v * (phone ? 0.27 : 0.115), SHORE_Y, s],
    palmsR: [right + 5 * s, SHORE_Y, s],
    boat2: [right - v * (phone ? 0.55 : 0.22), SHORE_Y + 80 * s, s],
    turtle: [right - v * (phone ? 0.12 : 0.06), SHORE_Y + 28 * s, s],
  }
}

const { css: placement, placed } = layout(spots)

const SCENE = `${SVG_OPEN}
<defs>
${grad('g-sun', '#fff2a0', 0.6)}${scrimGradient('#e4f3f9')}
</defs>
<style>
${placement}
${MOTION_CSS}
  .ray-a, .ray-b { animation: flip 1.6s step-end infinite; }
  .ray-b { animation-delay: -0.8s; }

  .gull-a, .gull-b { animation: flip 0.8s step-end infinite; }
  .gull-b { animation-delay: -0.4s; }

  .kite { animation: kite 2s step-end infinite; }
  @keyframes kite { 0% { transform: translateX(0); } 50% { transform: translateX(1px); } }

  .palm { animation: kite 3s step-end infinite; }

  .foam-a, .foam-b { animation: flip 1.4s step-end infinite; }
  .foam-b { animation-delay: -0.7s; }
${calm('.cloud', '.ray-a', '.ray-b', '.gull-a', '.gull-b', '.kite', '.palm', '.foam-a', '.foam-b', '.glint-a', '.glint-b', '.rock')}
</style>
${skyBands(SKY)}
${placed('sun', sun())}
${clouds()}
${placed('gulls', gulls())}
${placed('wau', wau())}
${islands()}
${beach()}
${placed('palmsL', palms([[0, 30, 4], [9, 24, -3], [17, 34, 5]]))}
${placed('crystal', crystalMosque())}
${placed('palmsR', palms([[-3, 26, -4], [-13, 22, 3]]))}
${sea()}
${placed('crystal', reflect([[0, 18, '#e8f4f8', 12], [27, 2, '#f0f6f9', 14]]))}
${placed('floating', reflect([[0, 22, '#fcfeff', 8]]))}
${placed('floating', floatingMosque())}
${placed('boat1', boat())}
${placed('boat2', boat())}
${surf()}
${placed('turtle', turtle())}
${SCRIM}
</svg>`

export const terengganu: LookSpec = {
  id: 'terengganu',
  label: 'Terengganu',
  description: 'Pixel-art Terengganu by day: the Crystal Mosque, the Floating Mosque, a fishing boat and a turtle',
  problems,
  theme: {
    colors: theme,
    backdrop: { scene: 'terengganu', glass: { blur: 0, tint: '#e4f3f9', opacity: 0.4 } },
  },
  scenes: {
    terengganu: {
      source: SCENE,
      alt: 'Pixel art of the Terengganu coast by day: the Crystal Mosque with a faceted glass dome and a tall minaret on the right, with coconut palms and a leatherback turtle on the sand; the Floating Mosque on the water, a fishing boat with a painted prow, the sun and a far island on the left; a wau kite and seagulls in a bright blue sky over a turquoise sea',
    },
  },
}
