import type { LookSpec } from './types'

import { makeColors } from '../make-colors.js'
import { Art, calm, GH, glow, grad, GW, layout, mist, MOTION_CSS, PX, px, ripples, SCRIM, scrimGradient, seeded, skyBands, SVG_OPEN, view, type Spot, type Stops } from '../kit'
import { gasing, gunungan, hanuman, pakDogol, rama, SCREEN_X, wakLong, wau } from './kelantan'

// The Kelantan village by day, drawn as pixel art: the same scene as the night look, in sunlight.
// On the right the wooden stage of the wayang kulit under its carved roof, with the cloth screen
// pale in the daylight and the shadow puppets still stuck in the banana trunk, and the musicians'
// gong and drum beside it. On the left a Kelantan Malay house on stilts and coconut palms. In the
// gap between them a wau bulan kite flies under the sun, birds cross the sky, and a gasing (spinning
// top) spins on the road, over bright green paddy fields and blue hills. A light look. The accent
// is the brown-gold of old wood and songket, readable on a light page; red keeps meaning danger.
// The shapes of the stage, the puppets, the kite and the top are shared with the night look.
const { theme, problems } = makeColors({
  label: 'Kelantan Day',
  only: 'light',
  roles: {
    accent: '#9a5512',
    danger: '#c0392b',
    success: '#2f8f4a',
    warning: '#b7861a',
    pro: '#8a5ac8',
  },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f7f0e0',
        'surface-1': '#fbf6ea',
        'surface-2': '#fefaf2',
        'surface-3': '#fefaf2',
        'text-primary': '#2a1a10',
        'text-secondary': '#5a4632',
        'text-muted': '#6e5a44',
      },
    },
  },
})

// The ground line, in art pixels: the village stands on it, the paddy fields run below it.
const SHORE = 150

// The leafy green of the far village.
const FAR = '#4a8a62'

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
  [135, '#e2f2f0'],
  [148, '#f8f2d8'],
]

// ---------- the sun (centre of the disc at the origin) ----------

function sun(): string {
  const core = new Art()
  const raysA = new Art()
  const raysB = new Art()

  core.disc(0, 0, 8, '#ffe066')
  core.disc(0, 0, 6, '#fff2a0')
  // Short rays, in two sets shown in turn, so the sun seems to shimmer.
  for (let k = 0; k < 16; k++) {
    const angle = (k / 16) * Math.PI * 2
    const [dx, dy] = [Math.cos(angle), Math.sin(angle)]

    ;(k % 2 === 0 ? raysA : raysB).line(dx * 11, dy * 11, dx * 14, dy * 14, '#fff2a0')
  }

  return px(glow(0, 0, 30, 30, 'g-sun', 0.55) + core.svg()) + px(raysA.svg(), 'glint-a') + px(raysB.svg(), 'glint-b')
}

// ---------- birds (centre of the flock at the origin) ----------

// Three birds, each a small V, in two sets with wings up and wings level, shown in turn.
function birds(): string {
  const up = new Art()
  const level = new Art()

  for (const [x, y] of [[0, 0], [14, 6], [-12, 8]] as const) {
    for (const [dx, dy] of [[-2, -1], [-1, 0], [0, 1], [1, 0], [2, -1]] as const) {
      up.set(x + dx, y + dy, '#3a4a5a')
    }
    for (const dx of [-2, -1, 0, 1, 2]) {
      level.set(x + dx, y + (dx === 0 ? 0 : -1), '#3a4a5a')
    }
  }

  return px(up.svg(), 'bird-a') + px(level.svg(), 'bird-b')
}

// ---------- a coconut palm (foot at the origin) ----------

function palm(lean: number, height: number, seed: number): string {
  const rand = seeded(seed)
  const trunk = new Art()
  const fronds = new Art()

  for (let t = 0; t <= height; t++) {
    const x = Math.round(lean * (t / height) ** 1.6)

    trunk.rect(x, -t, 2, 1, t % 3 === 0 ? '#9a7040' : '#7a5430')
  }
  const [topX, topY] = [lean, -height]

  for (const angle of [-165, -140, -112, -80, -52, -25, -5]) {
    const [dx, dy] = [Math.cos((angle * Math.PI) / 180), Math.sin((angle * Math.PI) / 180)]
    const reach = 11 + Math.floor(rand() * 4)

    for (let k = 0; k <= reach; k++) {
      const droop = (k * k) / 26

      fronds.set(topX + dx * k, topY + dy * k + droop, k % 3 === 2 ? '#6ac060' : '#3a9a4a')
      fronds.set(topX + dx * k, topY + dy * k + droop + 1, '#2a7a3a')
    }
  }
  fronds.disc(topX, topY + 1, 1.5, '#8a5a2a')

  return px(trunk.svg()) + px(`<g class="sway-a">${fronds.svg()}</g>`)
}

// ---------- a Kelantan Malay house on stilts (centre of its foot at the origin) ----------

function house(): string {
  const body = new Art()
  const roof = new Art()

  for (const x of [-21, -11, -1, 9, 19]) {
    body.rect(x, -9, 2, 9, '#6a4426')
  }
  body.rect(-25, -10, 51, 1, '#c89a60')
  body.rect(-25, -9, 51, 1, '#7a5030')
  // The walls: upright planks, with a carved band under the eaves.
  body.rect(-22, -27, 45, 17, '#b87a44')
  for (let x = -22; x < 23; x += 3) {
    body.rect(x, -27, 1, 17, '#a06a38')
  }
  body.rect(-22, -27, 45, 3, '#d49a58')
  for (let x = -21; x < 22; x += 3) {
    body.rect(x, -26, 2, 1, '#7a4a26')
    body.set(x + 1, -25, '#7a4a26')
  }
  // Two shuttered windows with glass, and the open door.
  for (const wx of [-17, 11]) {
    body.rect(wx, -22, 7, 8, '#5a3a22')
    body.rect(wx + 1, -21, 5, 6, '#cfe8f4')
    body.rect(wx + 3, -21, 1, 6, '#5a3a22')
  }
  body.rect(-3, -21, 7, 11, '#4a2e18')
  body.rect(-2, -20, 5, 9, '#7a5030')
  // The steps.
  for (let k = 0; k < 5; k++) {
    body.rect(-30 + k * 1, -k * 2, 6 - k, 1, '#8a5a34')
  }
  body.rect(-29, -2, 1, 2, '#6a4426')
  // The gable roof: steep, with rows of tiles, a bright edge, and crossed finials at the ridge.
  for (let r = 0; r < 20; r++) {
    const half = 29 - Math.round(r * 1.45)
    const y = -28 - r

    roof.rect(-half, y, half * 2 + 1, 1, r % 3 === 0 ? '#a53a26' : '#c0472f')
    roof.set(-half, y, '#e8704a')
    roof.set(half, y, '#e8704a')
  }
  roof.rect(-31, -28, 63, 2, '#8a2a1e')
  roof.line(-4, -50, 4, -45, '#e0a838')
  roof.line(4, -50, -4, -45, '#e0a838')
  roof.rect(0, -52, 1, 4, '#e0a838')

  return px(body.svg() + roof.svg())
}

// ---------- the wayang kulit stage (centre of its foot at the origin) ----------

function stage(): string {
  const wood = new Art()
  const screen = new Art()
  const musicians = new Art()
  const casts = [new Art(), new Art(), new Art()]
  const roof = new Art()

  // The platform on stilts.
  for (const x of [-32, -18, -4, 10, 26]) {
    wood.rect(x, -8, 2, 8, '#6a4426')
  }
  wood.rect(-35, -9, 71, 2, '#8a5a34')
  wood.rect(-35, -9, 71, 1, '#c89a60')
  // The screen: white cloth, with the daylight shining through, in a red frame.
  const bands: readonly (readonly [number, string])[] = [[-32, '#fff6d6'], [-27, '#ffefc0'], [-22, '#ffe6a8'], [-17, '#ffdc92'], [-13, '#ffd27a']]

  bands.forEach(([from, color], i) => {
    const to = bands[i + 1]?.[0] ?? -10

    screen.rect(SCREEN_X - 18, from, 37, to - from, color)
  })
  screen.rect(SCREEN_X - 19, -33, 39, 1, '#a8322a')
  screen.rect(SCREEN_X - 19, -33, 1, 24, '#a8322a')
  screen.rect(SCREEN_X + 19, -33, 1, 24, '#a8322a')
  screen.rect(SCREEN_X - 19, -10, 39, 1, '#a8322a')
  // The banana-trunk bar the puppets are stuck into.
  screen.rect(SCREEN_X - 18, -12, 37, 2, '#3a1c10')
  // The musicians' side: a wooden wall, a hanging gong, a drum, and two seated players.
  musicians.rect(-35, -31, 27, 22, '#c28a50')
  for (let x = -35; x < -8; x += 3) {
    musicians.rect(x, -31, 1, 22, '#ad7842')
  }
  musicians.rect(-32, -30, 1, 21, '#6a4426')
  musicians.rect(-14, -30, 1, 21, '#6a4426')
  musicians.rect(-32, -30, 19, 1, '#6a4426')
  musicians.line(-23, -29, -23, -26, '#3a1c10')
  musicians.disc(-23, -22, 5, '#a8741a')
  musicians.disc(-23, -22, 4, '#e0a838')
  musicians.disc(-23, -22, 1, '#fff1c9')
  musicians.rect(-26, -13, 9, 3, '#8a4a2a')
  musicians.rect(-27, -13, 1, 3, '#d9b070')
  musicians.rect(-17, -13, 1, 3, '#d9b070')
  musicians.disc(-29, -16, 2, '#2a0c04')
  musicians.rect(-31, -14, 5, 5, '#2a0c04')
  musicians.disc(-11, -15, 2, '#2a0c04')
  musicians.rect(-13, -13, 5, 4, '#2a0c04')
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
  for (const x of [-35, 34]) {
    wood.rect(x, -38, 2, 29, '#6a4426')
  }
  for (let r = 0; r < 14; r++) {
    const half = 38 - Math.round(r * 2.6)
    const y = -38 - r

    roof.rect(-half - 1, y, half * 2 + 1, 1, r % 3 === 0 ? '#a53a26' : '#c0472f')
    roof.set(-half - 1, y, '#e8704a')
    roof.set(half - 1, y, '#e8704a')
  }
  roof.rect(-40, -38, 79, 2, '#8a2a1e')
  for (let x = -38; x < 37; x += 3) {
    roof.set(x, -36, '#e0a838')
    roof.set(x + 1, -35, '#e0a838')
  }
  roof.rect(-1, -56, 1, 4, '#e0a838')
  roof.line(-4, -55, 2, -51, '#e0a838')
  roof.line(2, -55, -4, -51, '#e0a838')

  return px(wood.svg() + musicians.svg()) + px(screen.svg()) + casts.map((c, i) => px(c.svg(), `cast cast-${i}`)).join('') + px(roof.svg())
}

// ---------- the far hills and village, right across ----------

function village(): string {
  const rand = seeded(47)
  const body = new Art()

  for (let x = 0; x < GW; x++) {
    const h = Math.round(18 + 9 * Math.sin(x / 26) + 5 * Math.sin(x / 9 + 1))

    body.rect(x, SHORE - h, 1, h, '#8cbca6')
    body.set(x, SHORE - h, '#a8d2bc')
  }
  for (let x = -2; x < GW; ) {
    const w = 6 + Math.floor(rand() * 8)

    if (rand() < 0.5) {
      const h = 12 + Math.floor(rand() * 10)
      const cx = x + (w >> 1)

      body.rect(cx, SHORE - h, 1, h, '#5a7a4a')
      body.disc(cx, SHORE - h, 3 + Math.floor(rand() * 2), FAR)
    } else {
      const h = 7 + Math.floor(rand() * 3)

      body.rect(x, SHORE - h, w, h, '#b08a5a')
      for (let r = 0; r < 3; r++) {
        body.rect(x - 1 + r, SHORE - h - 1 - r, w + 2 - r * 2, 1, '#a84a36')
      }
    }
    x += w + Math.floor(rand() * 4)
  }

  return px(body.svg())
}

// ---------- the paddy fields ----------

function fields(): string {
  const a = new Art()

  a.rect(0, SHORE, GW, GH - SHORE, '#7cc05a')
  a.rect(0, SHORE + 16, GW, GH - SHORE - 16, '#6cb04c')
  a.rect(0, SHORE + 32, GW, GH - SHORE - 32, '#5ca03e')
  ripples(a, SHORE + 3, GH, '#9ad46e')
  ripples(a, SHORE + 4, GH, '#cfeff8', 7, 0.18)
  // The banks between the fields, and the village road along the top.
  for (const y of [SHORE + 12, SHORE + 30, SHORE + 48]) {
    a.rect(0, y, GW, 1, '#4a8a34')
  }
  a.rect(0, SHORE - 1, GW, 2, '#c8a870')

  return px(a.svg())
}

// ---------- layout ----------
//
// The house and its palms stand at the left (under the app's sidebar on a desktop), the sun, the
// kite, the birds and the spinning top in the gap between the sidebar and the conversation, and
// the stage past the conversation on the right, with a palm behind it. Phones have no sidebar, so
// all of it draws in and shrinks.

type Spots = Record<'house' | 'palmL' | 'palmM' | 'palmR' | 'gasing' | 'wau' | 'sun' | 'birds' | 'stage', Spot>

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
    sun: [left + v * (phone ? 0.32 : 0.1), top + 100 * s, s],
    birds: [left + v * (phone ? 0.5 : 0.17), top + 60 * s, s],
    // The stage stands clear of the veil behind the conversation, which fades out by 88%. Its
    // screen is on the right, the side that is always clear.
    stage: [right - v * (phone ? 0.22 : 0.2), SHORE_Y, s * 1.25],
  }
}

const { css: placement, placed } = layout(spots)

const SCENE = `${SVG_OPEN}
<defs>
${grad('g-sun', '#fff2a0', 0.6)}${grad('g-ember', '#ffb35a', 0.3)}${scrimGradient('#f6ecd6')}
</defs>
<style>
${placement}
${MOTION_CSS}
  /* The shadow play: three scenes, each shown for a third of a nine-second cycle. */
  .cast { animation: 9s step-end infinite; }
  .cast-1, .cast-2 { opacity: 0; }
  .cast-0 { animation-name: c0; } .cast-1 { animation-name: c1; } .cast-2 { animation-name: c2; }
  @keyframes c0 { 0% { opacity: 1; } 34% { opacity: 0; } }
  @keyframes c1 { 0% { opacity: 0; } 34% { opacity: 1; } 67% { opacity: 0; } }
  @keyframes c2 { 0% { opacity: 0; } 67% { opacity: 1; } }

  /* The top spins, the kite's tail waves and the birds flap: two sets shown in turn. */
  .spin-a { animation: flip 0.5s step-end infinite; }
  .spin-b { opacity: 0; animation: flip 0.5s step-end infinite -0.25s; }
  .flap-a { animation: flip 1.6s step-end infinite; }
  .flap-b { opacity: 0; animation: flip 1.6s step-end infinite -0.8s; }
  .bird-a { animation: flip 1.2s step-end infinite; }
  .bird-b { opacity: 0; animation: flip 1.2s step-end infinite -0.6s; }

  /* The palms sway a little. */
  .sway-a { animation: sway 2.4s step-end infinite; }
  @keyframes sway { 0% { transform: translateY(0); } 50% { transform: translateY(1px); } }
${calm('.cloud', '.glint-a', '.glint-b', '.rock', '.cast', '.spin-a', '.spin-b', '.flap-a', '.flap-b', '.bird-a', '.bird-b', '.sway-a')}
</style>
${skyBands(SKY)}
${mist([[22, 38, 44], [150, 30, 58], [240, 52, 38], [98, 64, 32], [190, 100, 46]], { top: '#ffffff', body: '#f2f8fc', lit: '#cfe0ec' })}
${placed('sun', sun())}
${placed('birds', birds())}
${placed('wau', wau())}
${village()}
${placed('palmM', palm(6, 40, 3))}
${placed('palmL', palm(-4, 52, 5))}
${placed('house', house())}
${placed('palmR', palm(-8, 46, 9))}
${placed('stage', stage())}
${fields()}
${placed('gasing', gasing())}
${SCRIM}
</svg>`

export const kelantanDay: LookSpec = {
  id: 'kelantan-day',
  label: 'Kelantan Day',
  description: 'Pixel-art Kelantan by day: a wayang kulit stage, a wau bulan kite, a gasing, and a village house on stilts',
  problems,
  theme: {
    colors: theme,
    backdrop: { scene: 'kelantan-day', glass: { blur: 0, tint: '#f6ecd6', opacity: 0.4 } },
  },
  scenes: {
    'kelantan-day': {
      source: SCENE,
      alt: 'Pixel art of a Kelantan village by day: on the right a wooden stage under a carved roof, with a pale cloth screen and wayang kulit puppets, and a gong and a drum beside it; on the left a Kelantan Malay house on stilts and coconut palms; in between the sun, a wau bulan kite, birds and a spinning gasing top, over green paddy fields and blue hills',
    },
  },
}
