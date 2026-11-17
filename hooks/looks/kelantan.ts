import type { LookSpec } from './types'

import { makeColors } from '../make-colors.js'
import { Art, calm, GH, glow, grad, GW, lampRow, layout, mist, MOTION_CSS, PX, px, reflection, ripples, SCRIM, scrimGradient, seeded, skyBands, stars, SVG_OPEN, view, Windows, type Spot, type Stops } from '../kit'

// A Kelantan village at night, drawn as pixel art, with a wayang kulit (shadow puppet) show. On the
// right a wooden stage under a carved gable roof: the lit screen (kelir) shows the shadows of the
// tree of life (gunungan), then of Seri Rama and Hanuman, then of the clowns Pak Dogol and Wak
// Long, while the musicians sit beside it with a hanging gong and a drum. On the left a Kelantan
// Malay house on stilts, with coconut palms. In the gap between them a wau bulan kite flies under
// a crescent moon, and a gasing (spinning top) spins on the ground. Fireflies drift over the
// paddy fields. The accent is a warm lamp gold; red keeps meaning danger. The puppets are simple
// shapes drawn from memory, not copies of real puppets.
const { theme, problems } = makeColors({
  label: 'Kelantan',
  only: 'dark',
  roles: {
    accent: '#e9b44c',
    danger: '#ff5d5d',
    success: '#5fd68a',
    warning: '#ffd24a',
    pro: '#a98bff',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b0916',
        'surface-1': '#110e1f',
        'surface-2': '#181428',
        'surface-3': '#201a34',
        'text-primary': '#f6f1f4',
        'text-secondary': '#cfc6d2',
        'text-muted': '#a89fb0',
      },
    },
  },
})

// The ground line, in art pixels: the village stands on it, the paddy fields run below it.
const SHORE = 150

// The ink of a shadow puppet, and of the dark shapes of the far village.
export const INK = '#2a0c04'
const FAR = '#150a20'

// ---------- sky ----------

// Deep indigo overhead, going through plum to an ember glow over the village.
const SKY: Stops = [
  [0, '#080a1e'],
  [22, '#0f1030'],
  [44, '#1a1238'],
  [66, '#2a1840'],
  [86, '#42204a'],
  [104, '#5e2a4c'],
  [118, '#7e3448'],
  [130, '#a24848'],
  [140, '#c8644a'],
  [148, '#e08a4a'],
]

// ---------- the crescent moon (centre of the disc at the origin) ----------

function moon(): string {
  const a = new Art()

  a.disc(0, 0, 9, '#fff1c9')
  // Cut a second disc out of the first, which leaves a crescent that opens to the upper right.
  for (let dy = -12; dy <= 12; dy++) {
    for (let dx = -12; dx <= 12; dx++) {
      if ((dx - 4) ** 2 + (dy + 3) ** 2 <= 8 * 8 + 4) {
        a.set(dx, dy, undefined)
      }
    }
  }

  return px(glow(0, 0, 22, 22, 'g-moon', 0.5) + a.svg())
}

// ---------- the wau bulan kite (centre of its body at the origin) ----------

// Half the width of the kite's body at row y: a rounded top, a wide middle and a rounded foot.
function kiteHalf(y: number): number {
  const rows: readonly (readonly [number, number])[] = [[-15, 1], [-12, 3], [-9, 4], [-6, 6], [-2, 10], [2, 16], [5, 13], [8, 8], [11, 4], [14, 1]]

  for (let i = 1; i < rows.length; i++) {
    const [y1, w1] = rows[i] ?? [0, 0]
    const [y0, w0] = rows[i - 1] ?? [0, 0]

    if (y <= y1) {
      return Math.round(w0 + ((w1 - w0) * (y - y0)) / (y1 - y0))
    }
  }

  return 0
}

export function wau(): string {
  const body = new Art()
  const moonShape = new Art()
  const tails = [new Art(), new Art()]

  for (let y = -15; y <= 14; y++) {
    const half = kiteHalf(y)

    body.rect(-half, y, half * 2 + 1, 1, '#c8402f')
    // The wing tips are blue, and the whole edge is gold.
    if (y >= -1) {
      body.rect(-half + 1, y, Math.max(0, half - 7), 1, '#2b6cb0')
      body.rect(8, y, Math.max(0, half - 7), 1, '#2b6cb0')
    }
    body.set(-half, y, '#e0a838')
    body.set(half, y, '#e0a838')
  }
  body.rect(0, -19, 1, 4, '#e0a838')
  // The bulan (moon) of the wau bulan: a big pale crescent in the lower middle, with gold flowers.
  moonShape.disc(0, 2, 7, '#fff1c9')
  for (let dy = -9; dy <= 9; dy++) {
    for (let dx = -9; dx <= 9; dx++) {
      if ((dx - 3) ** 2 + (dy - 2 + 2) ** 2 <= 6 * 6) {
        moonShape.set(dx, dy + 2, undefined)
      }
    }
  }
  for (const [fx, fy] of [[-12, 3], [12, 3], [0, -9], [-5, -5], [5, -5]] as const) {
    body.set(fx, fy, '#e0a838')
    body.set(fx - 1, fy, '#e0a838')
    body.set(fx + 1, fy, '#e0a838')
    body.set(fx, fy - 1, '#e0a838')
    body.set(fx, fy + 1, '#e0a838')
  }
  body.rect(-3, 10, 7, 1, '#e0a838')
  // The tail: two ribbons that wave, shown in turn.
  for (let n = 0; n < 24; n++) {
    tails[0]?.rect(Math.round(2 * Math.sin(n / 3)) - 1, 15 + n, 3, 1, n % 4 < 2 ? '#e0a838' : '#c8402f')
    tails[1]?.rect(Math.round(2 * Math.sin(n / 3 + Math.PI)) - 1, 15 + n, 3, 1, n % 4 < 2 ? '#e0a838' : '#c8402f')
  }

  return px(`<g class="rock">${glow(0, 2, 22, 22, 'g-ember', 0.3)}${body.svg()}${moonShape.svg()}</g>`) + tails.map((t, i) => px(`<g class="rock">${t.svg()}</g>`, `flap-${i === 0 ? 'a' : 'b'}`)).join('')
}

// ---------- a gasing, the spinning top (foot at the origin) ----------

export function gasing(): string {
  const a = new Art()
  const stripes = [new Art(), new Art()]

  a.rect(-7, 0, 15, 1, '#06130e')
  // A wooden body that narrows to a point, a wide gold rim on it, and the spindle on top.
  for (let y = -8; y <= -1; y++) {
    const half = Math.round((6 * (y + 1)) / -7)

    a.rect(-half, y, half * 2 + 1, 1, '#b87a3a')
    a.set(-half, y, '#d99a52')
  }
  a.rect(-7, -10, 15, 2, '#e0a838')
  a.rect(-5, -12, 11, 2, '#a86a3a')
  a.rect(0, -15, 1, 3, '#6a3a1a')
  // The stripes of the body, in two sets shown in turn, so the top seems to spin.
  for (const y of [-7, -5, -3]) {
    for (let x = -5; x <= 5; x++) {
      if (Math.abs(x) <= Math.round((6 * (y + 1)) / -7)) {
        stripes[(x + y + 40) % 2 === 0 ? 0 : 1]?.set(x, y, '#c8402f')
      }
    }
  }

  return px(a.svg()) + stripes.map((s, i) => px(s.svg(), `spin-${i === 0 ? 'a' : 'b'}`)).join('')
}

// ---------- a coconut palm (foot at the origin) ----------

function palm(lean: number, height: number, seed: number): string {
  const rand = seeded(seed)
  const trunk = new Art()
  const fronds = new Art()

  for (let t = 0; t <= height; t++) {
    const x = Math.round(lean * (t / height) ** 1.6)

    trunk.rect(x, -t, 2, 1, t % 3 === 0 ? '#3a2418' : '#2a1810')
  }
  const [topX, topY] = [lean, -height]

  for (const angle of [-165, -140, -112, -80, -52, -25, -5]) {
    const [dx, dy] = [Math.cos((angle * Math.PI) / 180), Math.sin((angle * Math.PI) / 180)]
    const reach = 11 + Math.floor(rand() * 4)

    for (let k = 0; k <= reach; k++) {
      const droop = (k * k) / 26

      fronds.set(topX + dx * k, topY + dy * k + droop, k % 3 === 2 ? '#1f5a3c' : '#143a2a')
      fronds.set(topX + dx * k, topY + dy * k + droop + 1, '#0e2a1e')
    }
  }
  fronds.disc(topX, topY + 1, 1.5, '#5a3a1a')

  return px(trunk.svg()) + px(`<g class="sway-a">${fronds.svg()}</g>`)
}

// ---------- a Kelantan Malay house on stilts (centre of its foot at the origin) ----------

function house(): string {
  const rand = seeded(83)
  const body = new Art()
  const roof = new Art()
  const win = new Windows()

  for (const x of [-21, -11, -1, 9, 19]) {
    body.rect(x, -9, 2, 9, '#2a1610')
  }
  body.rect(-25, -10, 51, 1, '#8a5a34')
  body.rect(-25, -9, 51, 1, '#3a2418')
  // The walls: upright planks, with a carved band under the eaves.
  body.rect(-22, -27, 45, 17, '#6a3a22')
  for (let x = -22; x < 23; x += 3) {
    body.rect(x, -27, 1, 17, '#5a2e1a')
  }
  body.rect(-22, -27, 45, 3, '#8a4a2a')
  for (let x = -21; x < 22; x += 3) {
    body.rect(x, -26, 2, 1, '#c98a3a')
    body.set(x + 1, -25, '#c98a3a')
  }
  // Two shuttered windows and the door, with a lamp lit inside.
  for (const wx of [-17, 11]) {
    body.rect(wx, -22, 7, 8, '#3a2418')
    win.still.rect(wx + 1, -21, 5, 6, rand() < 0.5 ? '#ffd27a' : '#ffe9b8')
    body.rect(wx + 3, -21, 1, 6, '#3a2418')
  }
  body.rect(-3, -21, 7, 11, '#2a1408')
  win.a.rect(-2, -20, 5, 9, '#ffb15a')
  // The steps, and the porch rail.
  for (let k = 0; k < 5; k++) {
    body.rect(-30 + k * 1, -k * 2, 6 - k, 1, '#5a3220')
  }
  body.rect(-29, -2, 1, 2, '#2a1610')
  // The gable roof: steep, with rows of tiles, a bright edge, and crossed finials at the ridge.
  for (let r = 0; r < 20; r++) {
    const half = 29 - Math.round(r * 1.45)
    const y = -28 - r

    roof.rect(-half, y, half * 2 + 1, 1, r % 3 === 0 ? '#5a1e18' : '#8a3226')
    roof.set(-half, y, '#e0603a')
    roof.set(half, y, '#e0603a')
  }
  roof.rect(-31, -28, 63, 2, '#c8402f')
  roof.line(-4, -50, 4, -45, '#e0a838')
  roof.line(4, -50, -4, -45, '#e0a838')
  roof.rect(0, -52, 1, 4, '#e0a838')

  return px(glow(0, -20, 36, 24, 'g-gold', 0.28) + body.svg() + roof.svg()) + win.svg()
}

// ---------- the wayang kulit stage (centre of its foot at the origin) ----------

// The screen sits at the right of the stage, centred on SCREEN_X, with its ground bar at row -12.
export const SCREEN_X = 13
export const CUT = '#ffd27a'

// Seri Rama in profile, facing `d` (1 right, -1 left): a pointed crown, a long skirt, and a bow.
export function rama(a: Art, ox: number, oy: number, d: number, drawn: boolean): void {
  const m = (x: number): number => ox + d * x

  a.rect(ox - 2, oy - 4, 2, 4, INK)
  a.rect(ox + 1, oy - 4, 2, 4, INK)
  a.rect(m(2), oy - 1, 3, 1, INK)
  a.rect(ox - 3, oy - 7, 7, 3, INK)
  a.rect(ox - 2, oy - 11, 5, 4, INK)
  a.disc(m(1), oy - 13, 2, INK)
  a.set(m(4), oy - 13, INK)
  a.rect(m(0), oy - 17, 3, 2, INK)
  a.rect(m(1), oy - 19, 1, 2, INK)
  a.set(m(-2), oy - 15, INK)
  a.line(m(2), oy - 10, m(8), oy - 12, INK)
  a.line(m(9), oy - 18, m(11), oy - 12, INK)
  a.line(m(11), oy - 12, m(9), oy - 6, INK)
  if (drawn) {
    a.line(m(2), oy - 10, m(9), oy - 12, INK)
    a.set(m(10), oy - 12, INK)
  }
}

// Hanuman, the white monkey, in profile: a raised club, and a long tail curling up behind.
export function hanuman(a: Art, ox: number, oy: number, d: number): void {
  const m = (x: number): number => ox + d * x

  a.rect(ox - 2, oy - 4, 2, 4, INK)
  a.rect(ox + 1, oy - 4, 2, 4, INK)
  a.rect(ox - 3, oy - 9, 6, 5, INK)
  a.disc(m(1), oy - 12, 2, INK)
  a.set(m(0), oy - 15, INK)
  a.set(m(2), oy - 15, INK)
  a.rect(m(3), oy - 12, 2, 1, INK)
  a.line(m(2), oy - 8, m(6), oy - 14, INK)
  a.rect(m(5), oy - 19, 3, 5, INK)
  a.line(m(-3), oy - 5, m(-7), oy - 7, INK)
  a.line(m(-7), oy - 7, m(-8), oy - 13, INK)
  a.line(m(-8), oy - 13, m(-6), oy - 16, INK)
}

// Pak Dogol, the round clown with the big nose. `bob` lifts him by one row.
export function pakDogol(a: Art, ox: number, oy: number, d: number, bob: number): void {
  const m = (x: number): number => ox + d * x
  const y0 = oy - bob

  a.disc(ox, y0 - 6, 4, INK)
  a.rect(ox - 2, y0 - 3, 2, 3, INK)
  a.rect(ox + 1, y0 - 3, 2, 3, INK)
  a.disc(m(2), y0 - 12, 2, INK)
  a.rect(m(4), y0 - 12, 3, 2, INK)
  a.line(m(2), y0 - 8, m(7), y0 - 5, INK)
  a.set(m(1), y0 - 15, INK)
}

// Wak Long, the tall, thin clown in a turban, with a staff.
export function wakLong(a: Art, ox: number, oy: number, d: number): void {
  const m = (x: number): number => ox + d * x

  a.rect(ox - 1, oy - 6, 1, 6, INK)
  a.rect(ox + 1, oy - 6, 1, 6, INK)
  a.rect(ox - 2, oy - 13, 5, 7, INK)
  a.disc(m(1), oy - 15, 1.5, INK)
  a.rect(m(-1), oy - 18, 4, 2, INK)
  a.set(m(3), oy - 15, INK)
  a.line(m(2), oy - 11, m(6), oy - 8, INK)
  a.rect(m(6), oy - 19, 1, 19, INK)
}

// The gunungan, the tree of life: a pointed leaf shape with a tree cut out of it.
export function gunungan(a: Art, ox: number, oy: number, h: number): void {
  const wide = h * 0.33

  for (let r = 0; r < h; r++) {
    const half = Math.round(wide * (1 - (r / h) ** 2.4))

    a.rect(ox - half, oy - r - 1, half * 2 + 1, 1, INK)
  }
  for (let r = 3; r < h - 4; r++) {
    a.set(ox, oy - r - 1, CUT)
  }
  for (let r = 5; r < h - 5; r += 3) {
    const reach = Math.min(2, Math.round(wide * (1 - (r / h) ** 2.4)) - 1)

    for (let k = 1; k <= reach; k++) {
      a.set(ox - k, oy - r - 1 - k, CUT)
      a.set(ox + k, oy - r - 1 - k, CUT)
    }
  }
  a.rect(ox - 1, oy - 3, 3, 3, CUT)
}

function stage(): string {
  const wood = new Art()
  const screen = new Art()
  const musicians = new Art()
  const casts = [new Art(), new Art(), new Art()]
  const lamp = new Art()

  // The platform on stilts.
  for (const x of [-32, -18, -4, 10, 26]) {
    wood.rect(x, -8, 2, 8, '#2a1610')
  }
  wood.rect(-35, -9, 71, 2, '#5a3220')
  wood.rect(-35, -9, 71, 1, '#8a5a34')
  // The screen: white cloth lit from behind, in bands from pale gold to deep amber, in a red frame.
  const bands: readonly (readonly [number, string])[] = [[-32, '#ffe9a8'], [-27, '#ffdc8a'], [-22, '#ffd27a'], [-17, '#fcc464'], [-13, '#f4a850']]

  bands.forEach(([from, color], i) => {
    const to = bands[i + 1]?.[0] ?? -10

    screen.rect(SCREEN_X - 18, from, 37, to - from, color)
  })
  screen.rect(SCREEN_X - 19, -33, 39, 1, '#a8322a')
  screen.rect(SCREEN_X - 19, -33, 1, 24, '#a8322a')
  screen.rect(SCREEN_X + 19, -33, 1, 24, '#a8322a')
  screen.rect(SCREEN_X - 19, -10, 39, 1, '#a8322a')
  // The banana-trunk bar the puppets are stuck into.
  screen.rect(SCREEN_X - 18, -12, 37, 2, '#2a1008')
  // The musicians' side: a lit wooden wall, a hanging gong, a drum, and two seated players.
  musicians.rect(-35, -31, 27, 22, '#7a4326')
  for (let x = -35; x < -8; x += 3) {
    musicians.rect(x, -31, 1, 22, '#6a3a22')
  }
  musicians.rect(-32, -30, 1, 21, '#4a2a1a')
  musicians.rect(-14, -30, 1, 21, '#4a2a1a')
  musicians.rect(-32, -30, 19, 1, '#4a2a1a')
  musicians.line(-23, -29, -23, -26, '#2a1610')
  musicians.disc(-23, -22, 5, '#a8741a')
  musicians.disc(-23, -22, 4, '#e0a838')
  musicians.disc(-23, -22, 1, '#fff1c9')
  musicians.rect(-26, -13, 9, 3, '#8a4a2a')
  musicians.rect(-27, -13, 1, 3, '#d9b070')
  musicians.rect(-17, -13, 1, 3, '#d9b070')
  musicians.disc(-29, -16, 2, INK)
  musicians.rect(-31, -14, 5, 5, INK)
  musicians.disc(-11, -15, 2, INK)
  musicians.rect(-13, -13, 5, 4, INK)
  // The shadows, in three scenes shown in turn: the tree of life; Rama and Hanuman; the clowns.
  const base = -12
  const [left, right] = [SCREEN_X - 6, SCREEN_X + 8]

  gunungan(casts[0] ?? screen, SCREEN_X, base, 19)
  rama(casts[1] ?? screen, left, base, 1, true)
  hanuman(casts[1] ?? screen, right, base, -1)
  gunungan(casts[1] ?? screen, SCREEN_X - 15, base, 12)
  pakDogol(casts[2] ?? screen, left, base, 1, 1)
  wakLong(casts[2] ?? screen, right, base, -1)
  gunungan(casts[2] ?? screen, SCREEN_X - 15, base, 12)
  // The gable roof: carved eaves, rows of tiles, and finials at the ridge.
  const roof = new Art()

  for (const x of [-35, 34]) {
    wood.rect(x, -38, 2, 29, '#4a2a1a')
  }
  for (let r = 0; r < 14; r++) {
    const half = 38 - Math.round(r * 2.6)
    const y = -38 - r

    roof.rect(-half - 1, y, half * 2 + 1, 1, r % 3 === 0 ? '#5a1e18' : '#8a3226')
    roof.set(-half - 1, y, '#e0603a')
    roof.set(half - 1, y, '#e0603a')
  }
  roof.rect(-40, -38, 79, 2, '#c8402f')
  for (let x = -38; x < 37; x += 3) {
    roof.set(x, -36, '#e0a838')
    roof.set(x + 1, -35, '#e0a838')
  }
  roof.rect(-1, -56, 1, 4, '#e0a838')
  roof.line(-4, -55, 2, -51, '#e0a838')
  roof.line(2, -55, -4, -51, '#e0a838')
  // The oil lamp behind the screen, which gives the light: it flickers.
  lamp.set(SCREEN_X, -34, '#fff1c9')

  return (
    px(wood.svg() + musicians.svg()) +
    px(screen.svg()) +
    px(glow(SCREEN_X, -22, 26, 16, 'g-lamp', 0.55), 'flame') +
    casts.map((c, i) => px(c.svg(), `cast cast-${i}`)).join('') +
    px(roof.svg() + lamp.svg()) +
    px(glow(-22, -20, 18, 14, 'g-gold', 0.35), 'flame')
  )
}

// ---------- the far village and the hills behind it, right across ----------

function village(): string {
  const rand = seeded(47)
  const body = new Art()
  const win = new Windows()

  for (let x = 0; x < GW; x++) {
    const h = Math.round(18 + 9 * Math.sin(x / 26) + 5 * Math.sin(x / 9 + 1))

    body.rect(x, SHORE - h, 1, h, '#241238')
    body.set(x, SHORE - h, '#35204c')
  }
  for (let x = -2; x < GW; ) {
    const w = 6 + Math.floor(rand() * 8)

    if (rand() < 0.5) {
      const h = 12 + Math.floor(rand() * 10)
      const cx = x + (w >> 1)

      body.rect(cx, SHORE - h, 1, h, FAR)
      body.disc(cx, SHORE - h, 3 + Math.floor(rand() * 2), FAR)
    } else {
      const h = 7 + Math.floor(rand() * 3)

      body.rect(x, SHORE - h, w, h, FAR)
      for (let r = 0; r < 3; r++) {
        body.rect(x - 1 + r, SHORE - h - 1 - r, w + 2 - r * 2, 1, FAR)
      }
      if (rand() < 0.55) {
        win.still.set(x + 1 + Math.floor(rand() * (w - 2)), SHORE - h + 2, '#ffcf7a')
      }
    }
    x += w + Math.floor(rand() * 4)
  }

  return px(body.svg()) + win.svg()
}

// ---------- the paddy fields ----------

function fields(): string {
  const a = new Art()

  a.rect(0, SHORE, GW, GH - SHORE, '#0c1f18')
  a.rect(0, SHORE + 16, GW, GH - SHORE - 16, '#0a1a14')
  a.rect(0, SHORE + 32, GW, GH - SHORE - 32, '#08140f')
  ripples(a, SHORE + 3, GH, '#1a4a34')
  // The banks between the fields, and a row of lamps along the village road.
  for (const y of [SHORE + 12, SHORE + 30, SHORE + 48]) {
    a.rect(0, y, GW, 1, '#1c3a28')
  }
  a.rect(0, SHORE - 1, GW, 2, '#2a1a1c')
  lampRow(a, SHORE - 2, 8, '#ffb35a')

  return px(a.svg())
}

// Fireflies over the fields, in three sets that blink in turn.
function fireflies(): string {
  const rand = seeded(19)
  const sets = [new Art(), new Art(), new Art()]

  for (let n = 0; n < 34; n++) {
    sets[n % 3]?.set(Math.floor(rand() * GW), SHORE - 14 + Math.floor(rand() * 34), n % 2 === 0 ? '#d8ff7a' : '#fff1a0')
  }

  return px(sets[0]?.svg() ?? '', 'star-a') + px(sets[1]?.svg() ?? '', 'star-b') + px(sets[2]?.svg() ?? '', 'blink')
}

// ---------- layout ----------
//
// The house and its palms stand at the left (under the app's sidebar on a desktop), the moon, the
// kite and the spinning top in the gap between the sidebar and the conversation, and the stage past
// the conversation on the right, with a palm behind it. Phones have no sidebar, so all of it draws
// in and shrinks.

type Spots = Record<'house' | 'palmL' | 'palmM' | 'palmR' | 'gasing' | 'wau' | 'moon' | 'stage', Spot>

const SHORE_Y = SHORE * PX

function spots(low: number, high: number): Spots {
  const { v, left, right, top, phone, s } = view(low, high)

  return {
    house: [left + (phone ? v * 0.25 : 165 * s), SHORE_Y, s * 1.15],
    palmL: [left + (phone ? v * 0.04 : 16 * s), SHORE_Y, s * 1.1],
    palmM: [left + v * (phone ? 0.4 : 0.2), SHORE_Y, s],
    palmR: [right - (phone ? v * 0.02 : 10 * s), SHORE_Y, s * 1.1],
    gasing: [left + v * (phone ? 0.52 : 0.27), SHORE_Y + 12 * s, s * 1.6],
    wau: [left + v * (phone ? 0.7 : 0.25), top + 150 * s, s * 1.2],
    moon: [left + v * (phone ? 0.32 : 0.1), top + 100 * s, s],
    // The stage stands clear of the veil behind the conversation, which fades out by 88%. Its
    // screen is on the right, the side that is always clear.
    stage: [right - v * (phone ? 0.22 : 0.2), SHORE_Y, s * 1.25],
  }
}

const { css: placement, placed } = layout(spots)

const SCENE = `${SVG_OPEN}
<defs>
${grad('g-gold', '#ffc66b', 0.5)}${grad('g-moon', '#d8d0ff', 0.4)}
${grad('g-ember', '#ff8a5a', 0.4)}${grad('g-lamp', '#ffb347', 0.6)}${scrimGradient('#0a0818')}
</defs>
<style>
${placement}
${MOTION_CSS}
  /* The lamp behind the screen flickers a little. */
  .flame { animation: flame 1.4s step-end infinite; }
  @keyframes flame { 0% { opacity: 1; } 35% { opacity: 0.78; } 70% { opacity: 0.94; } }

  /* The shadow play: three scenes, each shown for a third of a nine-second cycle. */
  .cast { animation: 9s step-end infinite; }
  .cast-1, .cast-2 { opacity: 0; }
  .cast-0 { animation-name: c0; } .cast-1 { animation-name: c1; } .cast-2 { animation-name: c2; }
  @keyframes c0 { 0% { opacity: 1; } 34% { opacity: 0; } }
  @keyframes c1 { 0% { opacity: 0; } 34% { opacity: 1; } 67% { opacity: 0; } }
  @keyframes c2 { 0% { opacity: 0; } 67% { opacity: 1; } }

  /* The top spins and the kite's tail waves: two sets shown in turn. */
  .spin-a { animation: flip 0.5s step-end infinite; }
  .spin-b { opacity: 0; animation: flip 0.5s step-end infinite -0.25s; }
  .flap-a { animation: flip 1.6s step-end infinite; }
  .flap-b { opacity: 0; animation: flip 1.6s step-end infinite -0.8s; }

  /* The palms sway a little. */
  .sway-a { animation: sway 2.4s step-end infinite; }
  @keyframes sway { 0% { transform: translateY(0); } 50% { transform: translateY(1px); } }
${calm('.star-a', '.star-b', '.blink', '.lit-a', '.lit-b', '.cloud', '.glint-a', '.glint-b', '.rock', '.flame', '.cast', '.spin-a', '.spin-b', '.flap-a', '.flap-b', '.sway-a')}
</style>
${skyBands(SKY)}
${stars(41, 90, 96, ['#fff6e0', '#c8c0e0', '#7a6a98'])}
${mist([[22, 104, 44], [150, 98, 58], [240, 110, 38], [98, 118, 32]], { top: '#2a1a40', body: '#3a2450', lit: '#8a4a58' })}
${placed('moon', moon())}
${placed('wau', wau())}
${village()}
${placed('palmM', palm(6, 40, 3))}
${placed('palmL', palm(-4, 52, 5))}
${placed('house', house())}
${placed('palmR', palm(-8, 46, 9))}
${placed('stage', stage())}
${fields()}
${placed('stage', reflection([[13, 14, '#ffb35a', 10], [-22, 7, '#e0a838', 6]]))}
${placed('house', reflection([[0, 8, '#ffb15a', 5]]))}
${placed('gasing', gasing())}
${fireflies()}
${SCRIM}
</svg>`

export const kelantan: LookSpec = {
  id: 'kelantan',
  label: 'Kelantan',
  description: 'Pixel-art Kelantan at night: a wayang kulit shadow play, a wau bulan kite, a gasing, and a village house on stilts',
  problems,
  theme: {
    colors: theme,
    backdrop: { scene: 'kelantan', glass: { blur: 0, tint: '#0b0916', opacity: 0.3 } },
  },
  scenes: {
    kelantan: {
      source: SCENE,
      alt: 'Pixel art of a Kelantan village at night: on the right a wooden stage under a carved roof, with a lit screen showing the shadows of wayang kulit puppets, and musicians with a gong and a drum beside it; on the left a Kelantan Malay house on stilts and coconut palms; in between a crescent moon, a wau bulan kite and a spinning gasing top; fireflies over the paddy fields',
    },
  },
}
