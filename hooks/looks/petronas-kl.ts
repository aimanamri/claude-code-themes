import type { LookSpec } from './types'

import { makeColors } from '../make-colors.js'
import { Art, calm, firework, FIREWORK_CSS, GH, glow, grad, GW, hazeCity, lampRow, layout, mist, MOTION_CSS, PX, px, reflection, ripples, SCRIM, scrimGradient, seeded, skyBands, stars, SVG_OPEN, view, Windows, type Spot, type Stops } from '../kit'

// Kuala Lumpur at dusk, drawn as pixel art, looking across the KLCC lake. On the right the
// Petronas Twin Towers with their skybridge, their spires lit, the fountain on the lake below
// and palms along the shore. On the left Merdeka 118 with its diamond crown, the Sultan Abdul
// Samad Building with its clock tower and copper domes, the Jalur Gemilang waving on its pole
// and KL Tower with its lit pod. Fireworks now and then, as on Merdeka night, over a sky that
// goes from indigo through plum to a warm amber glow. The accent is the yellow of the flag's
// crescent; red keeps meaning danger.
//
// The towers are drawn in proportion to each other only roughly: Merdeka 118 (678 m) is
// the tallest, then the Petronas Towers (452 m) and KL Tower (421 m), squeezed so all three fit.
const { theme, problems } = makeColors({
  label: 'Petronas KL',
  only: 'dark',
  roles: {
    accent: '#f2c230',
    danger: '#ff5d5d',
    success: '#5fd68a',
    warning: '#ff9f43',
    pro: '#a98bff',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#080b1a',
        'surface-1': '#0c1022',
        'surface-2': '#111629',
        'surface-3': '#161b30',
        'text-primary': '#f2f4fb',
        'text-secondary': '#c8cde0',
        'text-muted': '#a0a7c0',
      },
    },
  },
})

// The lake's edge, in art pixels: the skyline stands on it, the water runs below it.
const SHORE = 152

const CITY_WINDOWS = ['#ffd27a', '#ffd27a', '#ffe9b8', '#ffb86b', '#cfe2ff', '#9fe2ff']

// ---------- sky ----------

// Indigo overhead, warming through plum and rose to an amber glow over the city lights.
const SKY: Stops = [
  [0, '#070b1f'],
  [22, '#0b1230'],
  [44, '#121a40'],
  [66, '#1c2050'],
  [86, '#2c2258'],
  [104, '#43285e'],
  [118, '#5e2f5d'],
  [130, '#80395a'],
  [140, '#a84a52'],
  [148, '#d4694a'],
]

// ---------- fireworks (centred on their group's origin) ----------

// ---------- the distant city, right across ----------

// ---------- the Petronas Twin Towers (the gap between them at its origin, foot on the shore) ----------

const TOWER_H = 86
const TOWER_X = 15
const BRIDGE_T = 40

// Half the width of a tower at height t: it steps in as it climbs.
function towerHalfWidth(t: number): number {
  const f = t / TOWER_H

  return f < 0.4 ? 9 : f < 0.56 ? 8 : f < 0.68 ? 7 : f < 0.78 ? 6 : f < 0.87 ? 5 : f < 0.94 ? 4 : 3
}

function petronas(): string {
  const rand = seeded(53)
  const body = new Art()
  const rings = new Art()
  const tips = new Art()
  const beacons = new Art()
  const mall = new Art()
  const win = new Windows()

  // Suria KLCC, the mall at the towers' feet, its shopfronts lit.
  mall.rect(-36, -9, 73, 9, '#241d4a')
  mall.rect(-36, -9, 73, 1, '#4b4a85')
  for (let x = -34; x <= 33; x += 3) {
    win.still.rect(x, -6, 2, 1, '#ffd27a')
    win.a.rect(x, -3, 2, 1, '#ffe9b8')
  }

  for (const cx of [-TOWER_X, TOWER_X]) {
    for (let t = 0; t < TOWER_H; t++) {
      const y = -t - 1
      const hw = towerHalfWidth(t)

      for (let x = -hw; x <= hw; x++) {
        const flute = (x + 100) % 3 === 0 ? '#6c789f' : '#8d9ac0'

        body.set(cx + x, y, x === -hw ? '#d6e0ff' : x === hw ? '#4d5880' : flute)
      }
      // A ring of lit steel every six floors.
      if (t % 6 === 5) {
        rings.rect(cx - hw + 1, y, hw * 2 - 1, 1, '#eef3ff')
      }
      // Where the tower steps in, the ledge below catches the light.
      const below = towerHalfWidth(t - 1)

      if (t > 0 && below !== hw) {
        for (let x = hw + 1; x <= below; x++) {
          body.set(cx - x, y + 1, '#f4f7ff')
          body.set(cx + x, y + 1, '#f4f7ff')
        }
      }
    }
    // Lit windows, section by section, as the tower steps in.
    let start = 0

    for (let t = 1; t <= TOWER_H; t++) {
      if (t === TOWER_H || towerHalfWidth(t) !== towerHalfWidth(start)) {
        const hw = towerHalfWidth(start)

        win.fill(rand, cx - hw, -t, hw * 2 + 1, -start - 1, [3, 3], [1, 1], 0.16, ['#fff0c2', '#cfe2ff'])
        start = t
      }
    }
    // The crown: a dome, then the spire with its lit tip and its beacon.
    body.rect(cx - 2, -TOWER_H - 2, 5, 2, '#c9d3f2')
    body.rect(cx - 1, -TOWER_H - 4, 3, 2, '#dfe7ff')
    body.rect(cx, -TOWER_H - 16, 1, 12, '#b6c2e6')
    tips.set(cx, -TOWER_H - 16, '#fff7d6')
    beacons.set(cx, -TOWER_H - 17, '#ff4a4a')
  }
  // The skybridge: the deck between the towers, held up by an inverted V.
  body.rect(-6, -BRIDGE_T - 3, 13, 3, '#aab6da')
  body.rect(-6, -BRIDGE_T - 3, 13, 1, '#eef3ff')
  for (let x = -5; x <= 5; x += 2) {
    win.still.set(x, -BRIDGE_T - 1, '#ffe9b8')
  }
  for (let k = 0; k <= 11; k++) {
    const x = Math.round((k * 5) / 11)

    body.set(-x, -BRIDGE_T + k, '#c4cff0')
    body.set(x, -BRIDGE_T + k, '#c4cff0')
    body.set(-x + 1, -BRIDGE_T + k, '#6c789f')
    body.set(x - 1, -BRIDGE_T + k, '#6c789f')
  }

  return (
    px(glow(0, -46, 58, 62, 'g-silver', 0.4) + mall.svg()) +
    win.svg() +
    px(body.svg()) +
    px(rings.svg()) +
    px(tips.svg()) +
    px(beacons.svg(), 'blink')
  )
}

// ---------- Merdeka 118 (foot on the shore) ----------

const MERDEKA_H = 108

// The second tallest tower in the world: a glass shaft in diamond facets, narrowing to a lit
// crown and a spire.
function merdeka(): string {
  const body = new Art()
  const diamondA = new Art()
  const diamondB = new Art()
  const crown = new Art()
  const beacons = new Art()

  for (let t = 0; t < MERDEKA_H; t++) {
    const y = -t - 1
    const hw = Math.round(8 - 5 * (t / MERDEKA_H) ** 1.15)
    const isCrown = t > MERDEKA_H * 0.84

    for (let x = -hw; x <= hw; x++) {
      body.set(x, y, x === -hw ? '#4a6aa8' : x === hw ? '#121a38' : isCrown ? '#233a70' : '#1b2750')
      if ((x + t) % 7 === 0) {
        ;(isCrown ? crown : diamondA).set(x, y, isCrown ? '#ffd98a' : '#4fd3e8')
      }
      if ((x - t) % 7 === 0) {
        ;(isCrown ? crown : diamondB).set(x, y, isCrown ? '#ffd98a' : '#4fd3e8')
      }
    }
  }
  // The pointed top and the spire.
  for (let i = 0; i < 3; i++) {
    body.rect(-2 + i, -MERDEKA_H - 1 - i, 5 - i * 2, 1, '#2d4a86')
  }
  body.rect(0, -MERDEKA_H - 17, 1, 14, '#9fb0d8')
  crown.set(0, -MERDEKA_H - 17, '#fff7d6')
  beacons.set(0, -MERDEKA_H - 18, '#ff4a4a')

  return (
    px(glow(0, -MERDEKA_H * 0.55, 18, MERDEKA_H * 0.62, 'g-blue', 0.4) + body.svg()) +
    px(diamondA.svg(), 'facet-a') +
    px(diamondB.svg(), 'facet-b') +
    px(crown.svg()) +
    px(beacons.svg(), 'blink')
  )
}

// ---------- KL Tower (foot on the shore) ----------

function klTower(): string {
  const a = new Art()
  const ringA = new Art()
  const ringB = new Art()
  const beacons = new Art()
  const PODY = -72

  // The shaft, flared at its foot.
  for (let t = 0; t < 67; t++) {
    const hw = t < 14 ? Math.round(4 - 3 * (t / 14)) : 1

    for (let x = -hw; x <= hw; x++) {
      a.set(x, -t - 1, x === -hw ? '#a9b2d6' : x === hw ? '#4e5680' : '#7d86ae')
    }
  }
  // The pod, with its rings of lit windows.
  for (let dy = -5; dy <= 5; dy++) {
    const hw = Math.round(8 * Math.sqrt(1 - (dy / 5) ** 2))

    for (let dx = -hw; dx <= hw; dx++) {
      a.set(dx, PODY + dy, dy < -1 ? '#dfe5fb' : dy > 2 ? '#8089b0' : '#bcc5e6')
    }
  }
  for (let dx = -7; dx <= 7; dx += 2) {
    ringA.set(dx, PODY, '#ffd27a')
    ringB.set(dx + 1, PODY - 2, '#9fe2ff')
  }
  // The neck and the antenna above it.
  a.rect(-1, PODY - 15, 3, 10, '#7d86ae')
  a.rect(0, PODY - 29, 1, 14, '#b6c2e6')
  beacons.set(0, PODY - 30, '#ff4a4a')

  return px(glow(0, PODY, 16, 14, 'g-gold', 0.4) + a.svg()) + px(ringA.svg(), 'ring-a') + px(ringB.svg(), 'ring-b') + px(beacons.svg(), 'blink')
}

// ---------- the Sultan Abdul Samad Building (centred, foot on the shore) ----------

function sultanAbdulSamad(): string {
  const a = new Art()
  const lit = new Art()
  const copper = new Art()

  // The long facade: an arcade below, windows above, a pale cornice and belt.
  a.rect(-24, -11, 49, 11, '#a9794f')
  a.rect(-24, -11, 49, 1, '#e7cf9b')
  a.rect(-24, -5, 49, 1, '#e7cf9b')
  for (let x = -22; x <= 20; x += 4) {
    a.rect(x, -4, 2, 4, '#3a2418')
    lit.rect(x, -4, 2, 3, '#ffd27a')
    lit.rect(x, -9, 1, 3, '#ffe3a8')
  }
  // The turrets at its ends and middle, each with a copper dome.
  for (const cx of [-20, -10, 10, 20]) {
    a.rect(cx - 2, -18, 5, 7, '#b98756')
    a.rect(cx - 2, -18, 5, 1, '#e7cf9b')
    lit.set(cx, -15, '#ffd27a')
    for (let i = 0; i < 4; i++) {
      const hw = [2, 2, 1, 1][i] ?? 1

      copper.rect(cx - hw, -19 - i, hw * 2 + 1, 1, i === 0 ? '#3f9a86' : '#5cb8a0')
    }
    copper.set(cx, -23, '#e7cf9b')
  }
  // The clock tower in the middle.
  a.rect(-3, -34, 7, 23, '#b98756')
  a.rect(-3, -34, 1, 23, '#d4a574')
  a.rect(4, -34, 1, 23, '#7a4f33')
  a.rect(-3, -34, 8, 1, '#e7cf9b')
  a.rect(-3, -22, 8, 1, '#e7cf9b')
  a.disc(0, -28, 2, '#fff3c9')
  a.set(0, -28, '#3a2418')
  a.set(0, -29, '#3a2418')
  a.set(1, -28, '#3a2418')
  for (let i = 0; i < 6; i++) {
    const hw = [3, 3, 2, 2, 1, 1][i] ?? 1

    copper.rect(-hw + 1, -35 - i, hw * 2 + 1, 1, i === 0 ? '#3f9a86' : '#5cb8a0')
  }
  copper.rect(1, -44, 1, 3, '#e7cf9b')

  return px(glow(0, -14, 34, 22, 'g-gold', 0.4) + a.svg() + copper.svg() + lit.svg())
}

// ---------- the Jalur Gemilang (its pole's foot at its origin) ----------

const FLAG_W = 28
const POLE_H = 70

// The flag in one pose of its wave: fourteen red and white stripes, the blue canton, the
// yellow crescent and star.
function flagFrame(phase: number, top: number): Art {
  const a = new Art()

  for (let x = 0; x < FLAG_W; x++) {
    const dy = Math.round(Math.sin(x * 0.5 + phase) * 1.3 * (x / FLAG_W))

    for (let r = 0; r < 14; r++) {
      const inCanton = r < 8 && x < 14
      const fill = inCanton ? '#1b2a7a' : r % 2 === 0 ? '#d2202f' : '#f4f1ee'

      a.set(1 + x, top + r + dy, fill)
    }
    // The crescent: a yellow disc with a blue disc nibbling its right side.
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
  // The star.
  for (const [sx, sy] of [[10, 3], [9, 4], [10, 4], [11, 4], [10, 5], [10, 2], [10, 6]] as const) {
    a.set(1 + sx, top + sy + Math.round(Math.sin(sx * 0.5 + phase) * 1.3 * (sx / FLAG_W)), '#ffd23a')
  }

  return a
}

function flag(): string {
  const pole = new Art()

  pole.rect(0, -POLE_H, 1, POLE_H, '#cdd3ea')
  pole.rect(-1, -POLE_H - 1, 3, 1, '#ffd27a')
  pole.rect(-1, -2, 3, 2, '#4a4f80')

  return (
    px(glow(8, -POLE_H + 5, 24, 14, 'g-gold', 0.35) + pole.svg()) +
    px(flagFrame(0, -POLE_H).svg(), 'flag-a') +
    px(flagFrame(Math.PI, -POLE_H).svg(), 'flag-b')
  )
}

// ---------- palms along the shore (right edge, foot on the shore) ----------

function palms(): string {
  const a = new Art()
  const palm = (cx: number, h: number, lean: number): void => {
    for (let t = 0; t < h; t++) {
      const x = cx + Math.round(lean * (t / h) ** 2)

      a.set(x, -t - 1, '#1a2a2a')
      a.set(x + 1, -t - 1, '#101c1c')
    }
    const topx = cx + lean
    const topy = -h - 1

    for (let k = 0; k < 8; k++) {
      const angle = (k / 8) * Math.PI * 2

      for (let d = 1; d <= 8; d++) {
        const x = topx + Math.round(Math.cos(angle) * d)
        const y = topy + Math.round(Math.sin(angle) * d * 0.5 + d * d * 0.06)

        a.set(x, y, d > 5 ? '#1f5a37' : '#14452b')
      }
    }
  }

  palm(-30, 26, 4)
  palm(-18, 20, -3)
  palm(-4, 30, 5)

  return px(a.svg())
}

// ---------- the lake ----------

function water(): string {
  const a = new Art()

  a.rect(0, SHORE, GW, GH - SHORE, '#0b1226')
  a.rect(0, SHORE + 16, GW, GH - SHORE - 16, '#0a0f20')
  a.rect(0, SHORE + 32, GW, GH - SHORE - 32, '#070b18')
  ripples(a, SHORE + 3, GH, '#16213f')
  // The edge of the park, and the path's string of lamps along it.
  a.rect(0, SHORE - 1, GW, 2, '#233058')
  lampRow(a, SHORE - 2)

  return px(a.svg())
}

// ---------- the Lake Symphony fountain (centred on its waterline) ----------

function fountain(): string {
  const base = new Art()
  const jetA = new Art()
  const jetB = new Art()

  base.rect(-14, -1, 29, 2, '#233058')
  for (let k = -3; k <= 3; k++) {
    const apex = 16 - Math.abs(k) * 3
    const reach = k * 5

    for (let t = 0; t <= 1; t += 0.025) {
      const x = Math.round(reach * t)
      const y = -Math.round(4 * apex * t * (1 - t)) - 1
      const step = Math.floor(t * 30)

      ;(step % 2 === 0 ? jetA : jetB).set(x, y, t < 0.5 ? '#e8f8ff' : '#9fd6f2')
    }
    // The splash where each jet lands.
    ;(k % 2 === 0 ? jetA : jetB).set(reach, 0, '#e8f8ff')
  }

  return px(glow(0, -8, 20, 12, 'g-white', 0.4) + base.svg()) + px(jetA.svg(), 'jet-a') + px(jetB.svg(), 'jet-b')
}

// ---------- layout ----------
//
// Merdeka 118, the flag and the Sultan Abdul Samad Building stand at the left (under the app's
// sidebar on a desktop), KL Tower in the gap between the sidebar and the conversation, and the
// Petronas Towers, the palms and the fountain past the conversation on the right. Phones have no
// sidebar, so all of it draws in and shrinks.

type Spots = Record<'merdeka' | 'flag' | 'samad' | 'kltower' | 'petronas' | 'palms' | 'fountain' | 'fw1' | 'fw2' | 'fw3', Spot>

const SHORE_Y = SHORE * PX

function spots(low: number, high: number): Spots {
  const { v, left, right, top, phone, s } = view(low, high)

  return {
    merdeka: [left + v * (phone ? 0.1 : 0.055), SHORE_Y, s],
    flag: [left + v * (phone ? 0.27 : 0.135), SHORE_Y, s],
    // Off to the left on phones, where there is no room for it.
    samad: [phone ? left - 240 : left + v * 0.215, SHORE_Y, s],
    kltower: [left + v * (phone ? 0.42 : 0.315), SHORE_Y, s],
    // Both towers stand clear of the veil behind the conversation, which fades out by 88%.
    petronas: [right - v * (phone ? 0.27 : 0.085), SHORE_Y, s],
    palms: [right - v * 0.01, SHORE_Y, s],
    fountain: [right - v * (phone ? 0.27 : 0.085), SHORE_Y + 90 * s, s],
    fw1: [left + v * 0.14, top + 90 * s, s],
    fw2: [right - v * 0.07, top + 110 * s, s],
    fw3: [left + v * (phone ? 0.75 : 0.31), top + 104 * s, s],
  }
}

const { css: placement, placed } = layout(spots)

const SCENE = `${SVG_OPEN}
<defs>
${grad('g-gold', '#ffc66b', 0.5)}${grad('g-silver', '#cfe0ff', 0.4)}
${grad('g-blue', '#5fa8ff', 0.4)}${grad('g-white', '#ffffff', 0.45)}
${scrimGradient('#070a18')}
</defs>
<style>
${placement}
${MOTION_CSS}${FIREWORK_CSS}
  /* KL Tower's pod: two rings of lights in turn. Merdeka's facets: two sets in turn. */
  .ring-a, .ring-b { animation: fade 1.8s step-end infinite; }
  .ring-b { animation-delay: -0.9s; }
  .facet-a { animation: facet 9s step-end infinite; }
  .facet-b { opacity: 0; animation: facet 9s step-end infinite; animation-delay: -4.5s; }
  @keyframes facet { 0% { opacity: 1; } 50% { opacity: 0.25; } }

  /* The flag: two poses of its wave, one shown at a time. */
  .flag-a, .flag-b { animation: flip 1.2s step-end infinite; }
  .flag-b { opacity: 0; animation-delay: -0.6s; }

  .jet-a, .jet-b { animation: flip 0.6s step-end infinite; }
  .jet-b { animation-delay: -0.3s; }

  .at-fw2 .burst { animation-delay: -4s; }
  .at-fw3 .burst { animation-delay: -7.5s; }
${calm('.star-a', '.star-b', '.blink', '.lit-a', '.lit-b', '.cloud', '.ring-a', '.ring-b', '.facet-a', '.facet-b', '.flag-a', '.flag-b', '.glint-a', '.glint-b', '.jet-a', '.jet-b', '.burst')}
</style>
${skyBands(SKY)}
${stars(11, 80, 96, ['#fff6e0', '#c9c4ea', '#6f74a8'])}
${mist([[20, 104, 44], [148, 98, 58], [240, 110, 38], [98, 116, 32]], { top: '#26214f', body: '#3a2858', lit: '#8a4455' })}
${placed('fw1', firework(3, ['#ffd54a', '#ffb300', '#8a6a10']))}
${placed('fw2', firework(9, ['#ff5a6a', '#ff2f4a', '#7a1f2f']))}
${placed('fw3', firework(17, ['#6fb1ff', '#3f86ff', '#1f3f7f']))}
${hazeCity(17, SHORE, [8, 28], { body: '#1a1f3f', edge: '#2a3160', dim: '#3a4072', warm: '#c49860' })}
${placed('merdeka', merdeka())}
${placed('kltower', klTower())}
${placed('samad', sultanAbdulSamad())}
${placed('flag', flag())}
${placed('petronas', petronas())}
${placed('palms', palms())}
${water()}
${placed('merdeka', reflection([[0, 6, '#4fd3e8', 20]]))}
${placed('kltower', reflection([[0, 4, '#ffd27a', 10]]))}
${placed('samad', reflection([[-12, 10, '#ffd27a', 8], [12, 10, '#ffe3a8', 8]]))}
${placed('petronas', reflection([[-15, 8, '#dfe7ff', 24], [15, 8, '#dfe7ff', 24], [0, 14, '#ffd27a', 8]]))}
${placed('fountain', fountain())}
${SCRIM}
</svg>`

export const petronasKl: LookSpec = {
  id: 'petronas-kl',
  label: 'Petronas KL',
  description: 'Pixel-art Kuala Lumpur at dusk: the Petronas Twin Towers, Merdeka 118, KL Tower and the Jalur Gemilang',
  problems,
  theme: {
    colors: theme,
    backdrop: { scene: 'petronas-kl', glass: { blur: 0, tint: '#080b1a', opacity: 0.3 } },
  },
  scenes: {
    'petronas-kl': {
      source: SCENE,
      alt: 'Pixel art of Kuala Lumpur at dusk across the KLCC lake: the Petronas Twin Towers with their skybridge and a fountain on the right, Merdeka 118 with its diamond crown, the Sultan Abdul Samad Building with its clock tower and copper domes, the Malaysian flag waving, KL Tower with its lit pod, palms along the shore and fireworks in the sky',
    },
  },
}
