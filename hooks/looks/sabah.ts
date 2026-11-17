import type { LookSpec } from './types'

import { makeColors } from '../make-colors.js'
import { Art, calm, GH, glow, grad, GW, hash, layout, mist, MOTION_CSS, PX, px, reflection, ripples, SCRIM, scrimGradient, seeded, skyBands, SVG_OPEN, view, Windows, type Spot, type Stops } from '../kit'

// Sabah at sunset, drawn as pixel art, looking out over the sea. On the right Mount Kinabalu, the
// highest mountain of Borneo, with its granite peaks (Low's Peak, and the twin Donkey Ears) lit
// rose and gold by the low sun on their sunward side, a belt of cloud around its waist, a few
// lamps of the climbers' huts on its slope, and rainforest at its foot. On the left a Bajau stilt
// village stands in the shallows, with a boardwalk, lit windows and lanterns, against the glow of
// the sun, and a lepa boat with a tall sail of colored stripes rocks before it. The sun sinks over
// the horizon in the gap between, with low islands and a few clouds around it, and swiftlets cross
// a sky that goes from blue through rose to gold, over a sea that mirrors it. The accent is the
// blue-violet of the sky overhead; red keeps meaning danger. Everything is drawn from memory in a
// simple style, and is not to scale.
const { theme, problems } = makeColors({
  label: 'Sabah',
  only: 'dark',
  roles: {
    accent: '#8fb0ff',
    danger: '#ff5d6d',
    success: '#5fd68a',
    warning: '#ffd24a',
    pro: '#c79bff',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0a0a1e',
        'surface-1': '#10102a',
        'surface-2': '#171636',
        'surface-3': '#1f1e44',
        'text-primary': '#f4f2fb',
        'text-secondary': '#cdc9e0',
        'text-muted': '#a4a0c0',
      },
    },
  },
})

// The horizon, in art pixels: the mountain's forest stands on it, the sea runs below it.
const SHORE = 150

// ---------- sky ----------

// Blue overhead, through violet and rose to the orange and gold of the sunset at the horizon.
const SKY: Stops = [
  [0, '#2f4f9a'],
  [18, '#4a62a8'],
  [36, '#6a70b4'],
  [54, '#9a78b0'],
  [72, '#c8789e'],
  [90, '#e8828a'],
  [106, '#f49a72'],
  [120, '#ffb25e'],
  [134, '#ffcb6a'],
  [148, '#ffe08a'],
]

// ---------- the sun (centre of the disc at the origin) ----------

// A full disc just above the horizon, with short rays that shimmer in two sets.
function sun(): string {
  const core = new Art()
  const raysA = new Art()
  const raysB = new Art()

  core.disc(0, 0, 11, '#ffb860')
  core.disc(0, 0, 9, '#ffd070')
  core.disc(0, 0, 6, '#ffe9a0')
  for (let k = 0; k < 14; k++) {
    const angle = (k / 14) * Math.PI * 2
    const [dx, dy] = [Math.cos(angle), Math.sin(angle)]

    ;(k % 2 === 0 ? raysA : raysB).line(dx * 14, dy * 14, dx * 18, dy * 18, '#ffe9a8')
  }

  return px(glow(0, 0, 56, 44, 'g-sun', 0.75) + core.svg()) + px(raysA.svg(), 'glint-a') + px(raysB.svg(), 'glint-b')
}

// ---------- swiftlets (centre of the flock at the origin) ----------

// Three birds, each a small V, in two sets with wings up and wings level, shown in turn.
function birds(): string {
  const up = new Art()
  const level = new Art()

  for (const [x, y] of [[0, 0], [14, 6], [-12, 8]] as const) {
    for (const [dx, dy] of [[-2, -1], [-1, 0], [0, 1], [1, 0], [2, -1]] as const) {
      up.set(x + dx, y + dy, '#3a1c4a')
    }
    for (const dx of [-2, -1, 0, 1, 2]) {
      level.set(x + dx, y + (dx === 0 ? 0 : -1), '#3a1c4a')
    }
  }

  return px(up.svg(), 'bird-a') + px(level.svg(), 'bird-b')
}

// ---------- Mount Kinabalu (centre of its foot at the origin) ----------

// The ridge of the mountain as [x, height in rows]: a broad granite massif with a jagged crown. The
// two close peaks near the right of the crown are the Donkey Ears, and the highest one is Low's Peak.
const RIDGE: readonly (readonly [number, number])[] = [
  [-62, 0], [-54, 8], [-46, 18], [-38, 28], [-30, 38], [-24, 46], [-18, 52], [-14, 60], [-10, 58], [-6, 66], [-2, 74], [2, 70],
  [6, 64], [9, 70], [11, 63], [14, 70], [17, 60], [22, 54], [28, 46], [36, 34], [46, 20], [54, 10], [62, 0],
]

function ridge(x: number): number {
  for (let i = 1; i < RIDGE.length; i++) {
    const [x1, h1] = RIDGE[i] ?? [0, 0]
    const [x0, h0] = RIDGE[i - 1] ?? [0, 0]

    if (x <= x1) {
      return h0 + ((h1 - h0) * (x - x0)) / (x1 - x0)
    }
  }

  return 0
}

function mountain(): string {
  const body = new Art()
  const huts = new Art()

  for (let x = -62; x <= 62; x++) {
    const h = Math.round(ridge(x) + (hash(x, 7) - 0.5) * 2.4)
    // Which way the face looks, over a dozen columns so the two sides are clean: ground that rises to the right faces the sun.
    const slope = ridge(x + 6) - ridge(x - 6)
    const forest = 9 + Math.round(hash(x, 3) * 4)

    for (let y = 0; y < h; y++) {
      const t = y / h
      const lit = slope > 4
      let color: string

      if (y < forest) {
        color = hash(x, y, 1) < 0.22 ? '#123a34' : '#0b2624'
      } else if (lit) {
        color = t > 0.85 ? '#f2a58a' : t > 0.5 ? '#d4789a' : '#a85a8a'
        color = hash(x, y, 2) < 0.1 || (hash(x, 0, 5) < 0.1 && y > forest + 4) ? '#8a4a86' : color
      } else {
        color = t > 0.85 ? '#6a4a92' : t > 0.5 ? '#3a2a5e' : '#2a2050'
        color = hash(x, y, 2) < 0.1 ? '#1e1a3e' : color
      }
      body.set(x, -1 - y, y === h - 1 && y >= forest ? (lit ? '#ffd9a0' : '#8a6aa8') : color)
    }
  }
  // A few lamps of the climbers' huts on the slope, which blink.
  for (const [x, y] of [[-20, -50], [-17, -52], [-23, -47]] as const) {
    huts.set(x, y, '#ffd27a')
  }
  // The forest at the foot: tall trees with round crowns, along the shore.
  const rand = seeded(29)

  for (let x = -62; x <= 62; x += 3 + Math.floor(rand() * 3)) {
    const h = 8 + Math.floor(rand() * 7)

    body.rect(x, -h, 1, h, '#07181a')
    body.disc(x, -h, 3 + Math.floor(rand() * 2), rand() < 0.3 ? '#0e3030' : '#0a2424')
  }

  return px(glow(-8, -50, 56, 50, 'g-glow', 0.4) + body.svg()) + px(huts.svg(), 'blink')
}

// ---------- the clouds around the mountain's waist (centre at the origin) ----------

function cloudBelt(): string {
  return mist([[-60, -22, 46], [-14, -30, 52], [18, -18, 44], [-44, -40, 38]], { top: '#f4b6c0', body: '#d890a8', lit: '#ffd8a0' })
}

// ---------- the Bajau stilt village (centre of the boardwalk at the origin, on the water) ----------

function village(): string {
  const body = new Art()
  const roofs = new Art()
  const win = new Windows()
  const lanterns = [new Art(), new Art()]

  // The boardwalk on its stilts, running through the village.
  body.rect(-44, -8, 84, 1, '#8a5a34')
  body.rect(-44, -7, 84, 1, '#4a2e1a')
  for (let x = -42; x <= 38; x += 6) {
    body.rect(x, -6, 1, 9, '#3a2418')
  }
  const houses: readonly (readonly [number, number, string, string])[] = [
    [-36, 16, '#4a3020', '#2a2030'],
    [-14, 18, '#3a3a4a', '#2a2a3a'],
    [10, 16, '#5a3a24', '#2a2030'],
  ]

  houses.forEach(([x, w, wall, roof], i) => {
    body.rect(x, -22, w, 14, wall)
    for (let px0 = x + 3; px0 < x + w; px0 += 4) {
      body.rect(px0, -22, 1, 14, '#00000033')
    }
    // A pitched roof of tin or thatch, wider than the walls.
    for (let r = 0; r < 7; r++) {
      roofs.rect(x - 2 + r, -23 - r, w + 4 - r * 2, 1, r === 0 ? '#5a3a22' : roof)
    }
    win.still.rect(x + 3, -18, 3, 3, '#ffd27a')
    ;(i % 2 === 0 ? win.a : win.b).rect(x + w - 7, -18, 3, 3, '#ffb15a')
    body.rect(x + (w >> 1) - 1, -16, 3, 8, '#2a1810')
    // A lantern at the eave.
    lanterns[i % 2]?.rect(x + w - 1, -21, 2, 3, '#e63946')
    lanterns[i % 2]?.set(x + w - 1, -22, '#ffd24a')
  })

  return px(glow(0, -14, 70, 22, 'g-gold', 0.3) + body.svg() + roofs.svg()) + win.svg() + lanterns.map((l, i) => px(`<g class="sway-${i === 0 ? 'a' : 'b'}">${l.svg()}</g>`)).join('')
}

// ---------- a lepa boat with a tall striped sail (centre of the hull at the origin, on the water) ----------

function lepa(): string {
  const hull = new Art()
  const sail = new Art()
  const colors = ['#e63946', '#f7c948', '#2a9d8f', '#3a86ff', '#ff7b9c', '#8ac926']

  for (let x = -14; x <= 14; x++) {
    hull.set(x, -1, '#5a3418')
    hull.set(x, 0, Math.abs(x) > 12 ? '#2a1a10' : '#3a2214')
  }
  hull.rect(-12, -2, 25, 1, '#c8402f')
  hull.rect(-10, -3, 21, 1, '#e8a838')
  hull.set(14, -2, '#5a3418')
  hull.set(15, -3, '#5a3418')
  hull.set(15, -5, '#e8a838')
  hull.set(-15, -2, '#5a3418')
  hull.set(-15, -3, '#5a3418')
  hull.rect(0, -34, 1, 31, '#3a2418')
  // The sail: a tall banner of vertical stripes, and a small pennant on the mast.
  for (let x = 0; x < 12; x++) {
    sail.rect(1 + x, -30, 1, 25, colors[Math.floor(x / 2) % colors.length] ?? '#e63946')
  }
  sail.rect(1, -31, 12, 1, '#3a2418')
  sail.rect(1, -5, 12, 1, '#3a2418')
  sail.rect(0, -37, 5, 2, '#e63946')

  return px(`<g class="rock">${glow(0, -16, 18, 22, 'g-gold', 0.25)}${hull.svg()}${sail.svg()}</g>`)
}

// ---------- the low islands on the horizon, right across ----------

function islands(): string {
  const a = new Art()
  const rand = seeded(13)

  for (const [cx, half, height] of [[24, 22, 5], [200, 34, 6], [240, 18, 3], [285, 26, 5]] as const) {
    for (let x = cx - half; x <= cx + half; x++) {
      const h = Math.round(height * Math.max(0, 1 - ((x - cx) / half) ** 2) ** 0.7)

      a.rect(x, SHORE - h, 1, h, '#241a50')
      if (h > 2 && rand() < 0.5) {
        a.set(x, SHORE - h - 1, '#1a1440')
      }
    }
  }

  return px(a.svg())
}

// ---------- the sea ----------

function sea(): string {
  const a = new Art()

  a.rect(0, SHORE, GW, 10, '#f08a5a')
  a.rect(0, SHORE + 10, GW, 14, '#b8587a')
  a.rect(0, SHORE + 24, GW, 20, '#6a3a7e')
  a.rect(0, SHORE + 44, GW, GH - SHORE - 44, '#2e2a62')
  ripples(a, SHORE + 3, GH, '#ffc888', 0, 0.4)
  ripples(a, SHORE + 12, GH, '#8a5aa0', 5, 0.5)
  a.rect(0, SHORE, GW, 1, '#ffe08a')

  return px(a.svg())
}

// ---------- layout ----------
//
// The stilt village stands at the left (under the app's sidebar on a desktop), the sun, the boat
// and the birds in the gap between the sidebar and the conversation, and the mountain past the
// conversation on the right. Phones have no sidebar, so all of it draws in and shrinks.

type Spots = Record<'sun' | 'shine' | 'mountain' | 'village' | 'boat' | 'birds', Spot>

const SHORE_Y = SHORE * PX

function spots(low: number, high: number): Spots {
  const { v, left, right, top, phone, s } = view(low, high)

  return {
    sun: [left + v * (phone ? 0.5 : 0.25), SHORE_Y - 8 * PX * s, s * 1.1],
    shine: [left + v * (phone ? 0.5 : 0.25), SHORE_Y, s * 1.1],
    mountain: [right - v * (phone ? 0.22 : 0.17), SHORE_Y, s * 1.1],
    village: [left + (phone ? v * 0.2 : 130 * s), SHORE_Y + 26 * s, s],
    boat: [left + v * (phone ? 0.62 : 0.34), SHORE_Y + 90 * s, s * 1.15],
    birds: [left + v * (phone ? 0.3 : 0.16), top + 90 * s, s],
  }
}

const { css: placement, placed } = layout(spots)

const SCENE = `${SVG_OPEN}
<defs>
${grad('g-sun', '#ffd98a', 0.7)}${grad('g-glow', '#ff9a8a', 0.5)}
${grad('g-gold', '#ffc66b', 0.5)}${scrimGradient('#241038')}
</defs>
<style>
${placement}
${MOTION_CSS}
  /* The birds flap: two sets shown in turn. */
  .bird-a { animation: flip 1.2s step-end infinite; }
  .bird-b { opacity: 0; animation: flip 1.2s step-end infinite -0.6s; }

  /* The lanterns sway: two sets, one up while the other is down. */
  .sway-a { animation: sway 2.4s step-end infinite; }
  .sway-b { animation: sway 2.4s step-end infinite; animation-delay: -1.2s; }
  @keyframes sway { 0% { transform: translateY(0); } 50% { transform: translateY(1px); } }
${calm('.blink', '.lit-a', '.lit-b', '.cloud', '.glint-a', '.glint-b', '.rock', '.bird-a', '.bird-b', '.sway-a', '.sway-b')}
</style>
${skyBands(SKY)}
${mist([[22, 40, 44], [150, 30, 58], [240, 52, 38], [98, 70, 32], [200, 96, 46]], { top: '#ffb08a', body: '#e07a8a', lit: '#ffd8a0' })}
${placed('birds', birds())}
${placed('sun', sun())}
${islands()}
${mist([[10, 128, 60], [118, 134, 70], [250, 126, 50]], { top: '#ffc890', body: '#f09080', lit: '#ffe0a8' })}
${placed('mountain', mountain())}
${placed('mountain', cloudBelt())}
${sea()}
${placed('shine', reflection([[0, 10, '#ffd98a', 14], [0, 4, '#fffbe0', 8]], 0.55))}
${placed('mountain', reflection([[-8, 22, '#3a2a5e', 8], [20, 12, '#2a2050', 6]], 0.5))}
${placed('village', village())}
${placed('village', reflection([[-28, 10, '#ffb15a', 5], [18, 10, '#ffb15a', 5]], 0.35))}
${placed('boat', reflection([[0, 7, '#f7c948', 6]], 0.4))}
${placed('boat', lepa())}
${SCRIM}
</svg>`

export const sabah: LookSpec = {
  id: 'sabah',
  label: 'Sabah',
  description: 'Pixel-art Sabah at sunset: Mount Kinabalu, a Bajau stilt village and a lepa boat on the sea',
  problems,
  theme: {
    colors: theme,
    backdrop: { scene: 'sabah', glass: { blur: 0, tint: '#0a0a1e', opacity: 0.3 } },
  },
  scenes: {
    sabah: {
      source: SCENE,
      alt: 'Pixel art of Sabah at sunset over the sea: Mount Kinabalu on the right with its granite peaks lit rose and gold, a belt of cloud and rainforest at its foot; on the left a Bajau stilt village on the water with lit windows and lanterns; in front of the setting sun a lepa boat with a tall striped sail; low islands on the horizon and swiftlets in the sky',
    },
  },
}
