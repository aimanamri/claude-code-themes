import type { LookSpec } from './types'

import { makeColors } from '../make-colors.js'
import { Art, calm, GH, glow, grad, GW, hash, hazeCity, layout, MOTION_CSS, PX, px, SCRIM, scrimGradient, seeded, skyBands, stars, SVG_OPEN, view, Windows, type Spot, type Stops } from '../kit'

// Sepang International Circuit at dusk, drawn as pixel art, looking across the track from the pit
// wall. On the right the main grandstand under its white, tulip-shaped canopies, the crowd lit and
// "SEPANG" over the stands. In the gap on the left the start gantry with a PETRONAS banner and its
// five red lights, which come on one by one and go out. At the far left the control tower, with a
// hibiscus on its shaft, and the Jalur Gemilang waving beside it. The Petronas Towers stand hazy
// on the horizon, floodlight masts glow, and a storm builds over the palms, lit orange from below,
// with lightning now and then. A silver F1 car with teal stripes runs along the track. The accent
// is the teal of the PETRONAS livery; red keeps meaning danger.
const { theme, problems } = makeColors({
  label: 'Sepang F1',
  only: 'dark',
  roles: {
    accent: '#00d2be',
    danger: '#ff5d5d',
    success: '#5fd68a',
    warning: '#ffd24a',
    pro: '#a98bff',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b0d12',
        'surface-1': '#10131a',
        'surface-2': '#151922',
        'surface-3': '#1b202b',
        'text-primary': '#f3f6f8',
        'text-secondary': '#c9d0d8',
        'text-muted': '#9fa8b3',
      },
    },
  },
})

// The pit wall, in art pixels: the buildings stand on it, the track runs below it. Only the rows
// just under it show in a very wide window, so the track is a thin band.
const SHORE = 146

// ---------- sky ----------

// Violet overhead, burning through magenta and red to a hot orange at the horizon.
const SKY: Stops = [
  [0, '#0c0b24'],
  [20, '#161436'],
  [40, '#241a46'],
  [60, '#3a2058'],
  [80, '#582a62'],
  [100, '#7e3668'],
  [115, '#a8466a'],
  [128, '#d45a5a'],
  [138, '#f07a48'],
]

// Storm clouds: dark towers of puffs, lit orange along their undersides and violet on top.
function stormClouds(): string {
  const a = new Art()
  const rim = new Art()
  const puffs: [number, number, number][] = [
    [30, 96, 12], [48, 92, 16], [68, 98, 12], [40, 104, 14],
    [150, 84, 14], [170, 80, 18], [192, 86, 14], [176, 92, 16],
    [270, 100, 14], [290, 94, 17], [308, 102, 13], [286, 106, 15],
  ]

  for (const [cx, cy, r] of puffs) {
    a.disc(cx, cy, r, '#2a1a4a')
  }
  for (let y = 60; y < 124; y++) {
    for (let x = 0; x < GW; x++) {
      if (a.has(x, y) && !a.has(x, y + 1)) {
        rim.set(x, y, '#f07a48')
      } else if (a.has(x, y) && !a.has(x, y - 1)) {
        rim.set(x, y, '#4a2a6a')
      }
    }
  }

  return px(`<g class="cloud">${a.svg()}${rim.svg()}</g>`)
}

// A bolt of lightning in the middle cloud, flashing twice now and then.
function lightning(): string {
  const a = new Art()
  const pts: [number, number][] = [[172, 98], [169, 104], [173, 108], [167, 114], [170, 118], [164, 126]]

  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i] ?? [0, 0]
    const [x1, y1] = pts[i + 1] ?? [0, 0]

    a.line(x0, y0, x1, y1, '#fff6c0')
  }

  return px(`<g class="flash">${glow(170, 110, 20, 22, 'g-bolt', 0.8)}${a.svg()}</g>`)
}

// ---------- the horizon ----------

// The Petronas Towers, small and hazy (the gap between them at the origin, foot on the horizon).
function twins(): string {
  const a = new Art()
  const win = new Windows()

  for (const cx of [-6, 6]) {
    for (let t = 0; t < 36; t++) {
      const hw = t < 14 ? 3 : t < 24 ? 2 : 1

      for (let x = -hw; x <= hw; x++) {
        a.set(cx + x, -t - 1, x === -hw ? '#9a7aae' : x === hw ? '#4a3262' : '#6a4a7e')
      }
      if (t % 5 === 4 && t < 30) {
        win.still.set(cx, -t - 1, '#e0b080')
      }
    }
    a.rect(cx, -44, 1, 8, '#9a7aae')
  }
  a.rect(-3, -17, 7, 2, '#9a7aae')

  return px(glow(0, -20, 20, 30, 'g-haze', 0.35) + a.svg()) + win.svg()
}

// A row of palms along the horizon, black against the glow, their upper fronds rimmed orange.
function palmsRow(): string {
  const dark = new Art()
  const rim = new Art()

  for (const [cx, h, lean] of [[8, 16, 2], [44, 20, -3], [96, 15, 3], [150, 19, -2], [214, 17, 3], [262, 21, -3], [306, 16, 2]] as const) {
    for (let t = 0; t < h; t++) {
      dark.set(cx + Math.round(lean * (t / h) ** 2), SHORE - 1 - t, '#16281e')
    }
    const tx = cx + lean
    const ty = SHORE - 1 - h

    for (let k = 0; k < 9; k++) {
      const angle = (k / 9) * Math.PI * 2

      for (let d = 1; d <= 8; d++) {
        const x = tx + Math.round(Math.cos(angle) * d)
        const y = ty + Math.round(Math.sin(angle) * d * 0.45 + d * d * 0.05)

        dark.set(x, y, '#0f2a1f')
        if (d > 5 && Math.sin(angle) < -0.2) {
          rim.set(x, y - 1, '#c8603a')
        }
      }
    }
  }

  return px(dark.svg() + rim.svg())
}

// Floodlight masts, their lamp banks lit (the mast's foot at the origin).
function mast(): string {
  const a = new Art()

  a.rect(0, -34, 1, 34, '#2a2e3a')
  a.rect(-4, -39, 9, 5, '#1a1e28')
  for (let x = -3; x <= 3; x += 2) {
    a.set(x, -38, '#fff1c9')
    a.set(x, -36, '#fff1c9')
  }

  return px(glow(0, -36, 14, 12, 'g-lamp', 0.5) + a.svg())
}

// ---------- 3 by 5 letters, for the banner and the signs ----------

const FONT: Record<string, readonly string[]> = {
  S: ['111', '100', '111', '001', '111'],
  E: ['111', '100', '111', '100', '111'],
  P: ['111', '101', '111', '100', '100'],
  A: ['010', '101', '111', '101', '101'],
  N: ['1001', '1101', '1011', '1001', '1001'],
  G: ['111', '100', '101', '101', '111'],
  T: ['111', '010', '010', '010', '010'],
  R: ['111', '101', '110', '101', '101'],
  O: ['111', '101', '101', '101', '111'],
}

function letters(a: Art, x: number, y: number, word: string, fill: string): void {
  let cx = x

  for (const ch of word) {
    const glyph = FONT[ch] ?? []

    glyph.forEach((row, r) => {
      ;[...row].forEach((on, c) => {
        if (on === '1') {
          a.set(cx + c, y + r, fill)
        }
      })
    })
    cx += (glyph[0]?.length ?? 3) + 1
  }
}

// A red hibiscus, the national flower, five petals round a yellow heart.
function hibiscus(a: Art, cx: number, cy: number): void {
  for (const [dx, dy] of [[0, -2], [2, -1], [1, 2], [-1, 2], [-2, -1], [0, -1], [1, 0], [-1, 0], [0, 1]] as const) {
    a.set(cx + dx, cy + dy, '#e63946')
  }
  a.set(cx, cy, '#ffd24a')
}

// ---------- the control tower (centre of its foot at the origin) ----------

function controlTower(): string {
  const body = new Art()
  const win = new Windows()
  const beacons = new Art()

  body.rect(-14, -8, 29, 8, '#242a3a')
  body.rect(-14, -8, 29, 1, '#3a4258')
  for (let x = -12; x <= 12; x += 3) {
    win.still.rect(x, -5, 2, 2, '#ffd27a')
  }
  body.rect(-3, -42, 7, 34, '#3a4258')
  body.rect(-3, -42, 1, 34, '#566078')
  body.rect(3, -42, 1, 34, '#242a3a')
  for (let y = -12; y > -42; y -= 6) {
    body.rect(-3, y, 7, 1, '#2e3548')
  }
  hibiscus(body, 0, -24)
  // The control room: a wide glass cabin under a roof, lit in warm and teal panes.
  body.rect(-11, -54, 23, 11, '#2e3548')
  body.rect(-12, -55, 25, 2, '#566078')
  body.rect(-10, -52, 21, 6, '#14202c')
  for (let x = -9; x <= 9; x += 3) {
    ;(x % 2 === 0 ? win.a : win.still).rect(x, -51, 2, 3, x % 6 === 0 ? '#00d2be' : '#ffd27a')
  }
  body.rect(0, -68, 1, 13, '#9fa8b3')
  beacons.set(0, -69, '#ff4a4a')

  return px(glow(0, -48, 22, 16, 'g-lamp', 0.4) + body.svg()) + win.svg() + px(beacons.svg(), 'blink')
}

// ---------- the Jalur Gemilang (its pole's foot at its origin) ----------

const FLAG_W = 28
const POLE_H = 52

// The flag in one pose of its wave: fourteen red and white stripes, the blue canton, the yellow
// crescent and star.
function flagFrame(phase: number, top: number): Art {
  const a = new Art()

  for (let x = 0; x < FLAG_W; x++) {
    const dy = Math.round(Math.sin(x * 0.5 + phase) * 1.3 * (x / FLAG_W))

    for (let r = 0; r < 14; r++) {
      const inCanton = r < 8 && x < 14
      const fill = inCanton ? '#1b2a7a' : r % 2 === 0 ? '#d2202f' : '#f4f1ee'

      a.set(1 + x, top + r + dy, fill)
    }
    if (x < 14) {
      for (let r = 0; r < 8; r++) {
        const inDisc = (x - 5) ** 2 + (r - 3.5) ** 2 <= 9.5
        const inBite = (x - 6.6) ** 2 + (r - 3.5) ** 2 <= 6.5

        if (inDisc && !inBite) {
          a.set(1 + x, top + r + dy, '#ffd23a')
        }
      }
    }
  }
  for (const [sx, sy] of [[10, 3], [9, 4], [10, 4], [11, 4], [10, 5], [10, 2], [10, 6]] as const) {
    a.set(1 + sx, top + sy + Math.round(Math.sin(sx * 0.5 + phase) * 1.3 * (sx / FLAG_W)), '#ffd23a')
  }

  return a
}

function flag(): string {
  const pole = new Art()

  pole.rect(0, -POLE_H, 1, POLE_H, '#cfd6dc')
  pole.rect(-1, -POLE_H - 1, 3, 1, '#ffd24a')
  pole.rect(-1, -2, 3, 2, '#4a5268')

  return (
    px(glow(8, -POLE_H + 5, 24, 14, 'g-lamp', 0.3) + pole.svg()) +
    px(flagFrame(0, -POLE_H).svg(), 'flag-a') +
    px(flagFrame(Math.PI, -POLE_H).svg(), 'flag-b')
  )
}

// ---------- the start gantry (centre of its beam at the origin, feet on the pit wall) ----------

function chequered(phase: number): Art {
  const a = new Art()

  for (let x = 0; x < 10; x++) {
    const dy = Math.round(Math.sin(x * 0.7 + phase) * 1)

    for (let y = 0; y < 6; y++) {
      a.set(x, y + dy, (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0 ? '#ffffff' : '#12141a')
    }
  }

  return a
}

function gantry(): string {
  const body = new Art()
  const lights = [0, 1, 2, 3, 4].map(() => new Art())
  const banner = new Art()
  const flagPole = new Art()

  // Two posts and a beam with the PETRONAS banner, and the housing of the five lights under it.
  body.rect(-32, -34, 2, 34, '#4a5268')
  body.rect(31, -34, 2, 34, '#4a5268')
  body.rect(-32, -34, 66, 8, '#10141c')
  body.rect(-32, -34, 66, 1, '#566078')
  letters(banner, -16, -32, 'PETRONAS', '#00d2be')
  body.rect(-14, -26, 29, 6, '#1a1e28')
  for (let i = 0; i < 5; i++) {
    body.rect(-12 + i * 6, -25, 3, 3, '#3a1414')
    lights[i]?.rect(-12 + i * 6, -25, 3, 3, '#ff3030')
  }
  flagPole.rect(34, -44, 1, 14, '#cfd6dc')
  // The start line on the track below: a column of black and white squares.
  const line0 = new Art()

  for (let y = 2; y < 13; y++) {
    for (let x = -2; x <= 1; x++) {
      line0.set(x, y, (x + y) % 2 === 0 ? '#ffffff' : '#12141a')
    }
  }

  return (
    px(glow(0, -22, 26, 10, 'g-red', 0.3)) +
    px(body.svg() + banner.svg() + flagPole.svg() + line0.svg()) +
    lights.map((l, i) => px(`<g class="l${i + 1}">${glow(-11 + i * 6, -23, 5, 5, 'g-red', 0.9)}${l.svg()}</g>`)).join('') +
    px(`<g transform="translate(35 -44)">${chequered(0).svg()}</g>`, 'chq-a') +
    px(`<g transform="translate(35 -44)">${chequered(Math.PI).svg()}</g>`, 'chq-b')
  )
}

// ---------- the main grandstand (centre of its foot at the origin) ----------

function grandstand(): string {
  const rand = seeded(83)
  const body = new Art()
  const crowdA = new Art()
  const crowdB = new Art()
  const roof = new Art()
  const sign = new Art()
  const colors = ['#ff4d4d', '#ffd24a', '#00d2be', '#ffffff', '#5aa0ff', '#ff8ad0']

  body.rect(-33, -27, 66, 21, '#262b40')
  for (let y = -26; y < -7; y += 4) {
    body.rect(-33, y, 66, 1, '#1a1e2e')
  }
  // The crowd, a seat in two of three taken, in two sets that flicker in turn.
  for (let y = -25; y < -7; y += 2) {
    for (let x = -32; x < 33; x += 2) {
      if (rand() < 0.7) {
        ;(rand() < 0.5 ? crowdA : crowdB).set(x, y, colors[Math.floor(rand() * colors.length)] ?? '#ffffff')
      }
    }
  }
  // The fascia with the sign and a hibiscus.
  body.rect(-33, -6, 66, 6, '#0e1418')
  letters(sign, -12, -5, 'SEPANG', '#00d2be')
  hibiscus(sign, -22, -3)
  hibiscus(sign, 22, -3)
  // The canopy: three white petals, each a bump with ribs, on four posts.
  for (const cx of [-22, 0, 22]) {
    for (let dx = -11; dx <= 11; dx++) {
      const top = Math.round(15 * Math.max(0, 1 - Math.abs(dx) / 11) ** 1.5)

      for (let h = 0; h <= top; h++) {
        roof.set(cx + dx, -27 - h, h === top ? '#ffffff' : h < 2 ? '#8a96a8' : dx % 4 === 0 ? '#c0cad6' : '#e8eef4')
      }
    }
  }
  roof.rect(-33, -27, 66, 1, '#ffd98a')
  for (const x of [-33, -11, 11, 32]) {
    roof.rect(x, -26, 1, 20, '#8a96a8')
  }

  return (
    px(glow(0, -22, 46, 22, 'g-lamp', 0.4) + body.svg()) +
    px(crowdA.svg(), 'crowd-a') +
    px(crowdB.svg(), 'crowd-b') +
    px(sign.svg() + roof.svg())
  )
}

// ---------- the track ----------

function track(): string {
  const a = new Art()

  // The pit wall, red and white kerbs, the asphalt with its texture and a dashed centre line, then
  // mown grass.
  a.rect(0, SHORE, GW, 1, '#8a93a0')
  for (let x = 0; x < GW; x += 6) {
    a.rect(x, SHORE + 1, 3, 1, '#e63946')
    a.rect(x + 3, SHORE + 1, 3, 1, '#ffffff')
    a.rect(x, SHORE + 27, 3, 1, '#ffffff')
    a.rect(x + 3, SHORE + 27, 3, 1, '#e63946')
  }
  a.rect(0, SHORE + 2, GW, 25, '#2a2d36')
  for (let y = SHORE + 3; y < SHORE + 27; y += 2) {
    for (let x = Math.floor(hash(y, 5) * 7); x < GW; x += 7 + Math.floor(hash(x, y) * 6)) {
      a.rect(x, y, 2 + Math.floor(hash(y, x) * 3), 1, '#343842')
    }
  }
  for (let x = 2; x < GW; x += 10) {
    a.rect(x, SHORE + 14, 5, 1, '#c8ccd4')
  }
  a.rect(0, SHORE + 28, GW, GH - SHORE - 28, '#12301e')
  for (let y = SHORE + 28; y < GH; y += 4) {
    a.rect(0, y, GW, 2, '#14361f')
  }

  return px(a.svg())
}

// ---------- the F1 car (rear wheel's centre at the origin, wheels on the track, facing right) ----------

function car(cls: string): string {
  const a = new Art()

  // A silver car with teal stripes: rear wing, engine cover, cockpit with the driver's helmet, nose
  // and front wing, with the floor between the wheels.
  a.rect(-5, -7, 4, 1, '#cfd6dc')
  a.rect(-5, -7, 1, 3, '#8a95a0')
  a.rect(-2, -5, 11, 3, '#cfd6dc')
  a.rect(-1, -5, 9, 1, '#00d2be')
  a.rect(-2, -2, 15, 1, '#8a95a0')
  a.rect(9, -6, 3, 4, '#cfd6dc')
  a.rect(9, -7, 3, 1, '#8a95a0')
  a.rect(10, -6, 2, 1, '#ffd24a')
  a.rect(12, -4, 6, 1, '#cfd6dc')
  a.rect(12, -3, 5, 1, '#cfd6dc')
  a.set(18, -4, '#00d2be')
  a.rect(13, -1, 6, 1, '#8a95a0')
  a.rect(19, -3, 1, 3, '#8a95a0')
  a.disc(0, -2, 2.4, '#1a1c22')
  a.disc(0, -2, 1, '#aab4be')
  a.disc(14, -2, 2, '#1a1c22')
  a.disc(14, -2, 0.6, '#aab4be')

  return px(`<g class="${cls}">${glow(7, -3, 14, 6, 'g-lamp', 0.25)}${a.svg()}</g>`)
}

// ---------- layout ----------
//
// The control tower and the flag stand at the left (under the app's sidebar on a desktop), the
// start gantry in the gap between the sidebar and the conversation, and the main grandstand past
// the conversation on the right. The car runs the whole track. Phones have no sidebar, so all of
// it draws in and shrinks.

type Spots = Record<'tower' | 'flag' | 'gantry' | 'twins' | 'mastA' | 'mastB' | 'stand' | 'car' | 'car2', Spot>

const SHORE_Y = SHORE * PX

function spots(low: number, high: number): Spots {
  const { v, left, right, phone, s } = view(low, high)

  return {
    tower: [left + v * (phone ? 0.1 : 0.04), SHORE_Y, s],
    flag: [left + v * (phone ? 0.24 : 0.105), SHORE_Y, s],
    gantry: [left + v * (phone ? 0.4 : 0.235), SHORE_Y, s],
    twins: [left + v * (phone ? 0.72 : 0.42), SHORE_Y, s],
    mastA: [left + v * 0.5, SHORE_Y, s],
    mastB: [left + v * 0.66, SHORE_Y, s],
    // The grandstand stands clear of the veil behind the conversation, which fades out by 88%.
    stand: [right - 33 * PX * s, SHORE_Y, s],
    // Each car runs in a lane of the track, which is drawn at full size, so its row is not scaled.
    car: [0, SHORE_Y + 10 * PX, s],
    car2: [0, SHORE_Y + 22 * PX, s],
  }
}

const { css: placement, placed } = layout(spots)

const SCENE = `${SVG_OPEN}
<defs>
${grad('g-haze', '#c09acc', 0.4)}${grad('g-lamp', '#ffd98a', 0.5)}
${grad('g-red', '#ff3030', 0.5)}${grad('g-bolt', '#fff6c0', 0.5)}${scrimGradient('#0b0d12')}
</defs>
<style>
${placement}
${MOTION_CSS}
  /* Lightning: dark, then two quick flashes, once in nine seconds. */
  .flash { opacity: 0; animation: flash 9s step-end infinite; }
  @keyframes flash { 0% { opacity: 0; } 91% { opacity: 1; } 92% { opacity: 0; } 93% { opacity: 1; } 95% { opacity: 0; } }

  /* The start lights: one more red light every half second, then all out for the start. */
  .l1, .l2, .l3, .l4, .l5 { opacity: 0; animation-duration: 8s; animation-timing-function: step-end; animation-iteration-count: infinite; }
  .l1 { animation-name: l1; } .l2 { animation-name: l2; } .l3 { animation-name: l3; } .l4 { animation-name: l4; } .l5 { animation-name: l5; }
  @keyframes l1 { 0% { opacity: 0; } 6% { opacity: 1; } 60% { opacity: 0; } }
  @keyframes l2 { 0% { opacity: 0; } 12% { opacity: 1; } 60% { opacity: 0; } }
  @keyframes l3 { 0% { opacity: 0; } 18% { opacity: 1; } 60% { opacity: 0; } }
  @keyframes l4 { 0% { opacity: 0; } 24% { opacity: 1; } 60% { opacity: 0; } }
  @keyframes l5 { 0% { opacity: 0; } 30% { opacity: 1; } 60% { opacity: 0; } }

  /* The flag and the chequered flag: two poses of the wave, one shown at a time. */
  .flag-a, .flag-b, .chq-a, .chq-b { animation: flip 1.2s step-end infinite; }
  .flag-b, .chq-b { opacity: 0; animation-delay: -0.6s; }

  .crowd-a, .crowd-b { animation: fade 1.6s step-end infinite; }
  .crowd-b { animation-delay: -0.8s; }

  /* The cars cross the whole scene in steps, then start again from the left. */
  .run { animation: run 8s steps(40) infinite; }
  .run2 { animation-delay: -4s; }
  @keyframes run { from { transform: translateX(-30px); } to { transform: translateX(520px); } }
${calm('.star-a', '.star-b', '.blink', '.lit-a', '.cloud', '.flash', '.l1', '.l2', '.l3', '.l4', '.l5', '.flag-a', '.flag-b', '.chq-a', '.chq-b', '.crowd-a', '.crowd-b', '.run')}
</style>
${skyBands(SKY)}
${stars(41, 60, 70, ['#fff1e0', '#c9b8e6', '#7a6aa8'])}
${stormClouds()}
${lightning()}
${hazeCity(19, SHORE, [10, 24], { body: '#3a2650', edge: '#503268', dim: '#46305e', warm: '#c08a60' })}
${placed('twins', twins())}
${palmsRow()}
${placed('mastA', mast())}
${placed('mastB', mast())}
${placed('tower', controlTower())}
${placed('flag', flag())}
${placed('stand', grandstand())}
${track()}
${placed('gantry', gantry())}
${placed('car2', car('run run2'))}
${placed('car', car('run'))}
${SCRIM}
</svg>`

export const sepang: LookSpec = {
  id: 'sepang',
  label: 'Sepang F1',
  description: 'Pixel-art Sepang International Circuit at dusk: the grandstand, the start lights, an F1 car and the Petronas Towers',
  problems,
  theme: {
    colors: theme,
    backdrop: { scene: 'sepang', glass: { blur: 0, tint: '#0b0d12', opacity: 0.3 } },
  },
  scenes: {
    sepang: {
      source: SCENE,
      alt: 'Pixel art of Sepang International Circuit at dusk: the main grandstand with white tulip-shaped canopies and a lit crowd on the right, the start gantry with a PETRONAS banner and five red lights in the middle, the control tower and the Malaysian flag on the left, the Petronas Towers hazy on the horizon, a stormy orange sky with lightning, and a silver F1 car with teal stripes running along the track',
    },
  },
}
