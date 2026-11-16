import type { LookSpec } from './types'

import { makeColors } from '../make-colors.js'
import { Art, calm, firework, FIREWORK_CSS, GH, glow, grad, GW, H, hash, hazeCity, lampRow, layout, mist, MOTION_CSS, PX, px, reflection, ripples, SCRIM, scrimGradient, seeded, skyBands, stars, SVG_OPEN, view, Windows, type Spot, type Stops } from '../kit'

// George Town, Penang, at dusk, drawn as pixel art, looking across the strait to the island. On
// the left the Penang Bridge with its cable-stayed towers and chasing lights, and Penang Hill
// behind it, with the Kek Lok Si pagoda on its slope and the funicular's lights climbing to the
// summit. On the right Komtar, George Town's tallest tower, with its lit crown ring, a row of
// colorful shophouses at its feet, and the Clan Jetty's stilt houses and red lanterns on the
// water. The Penang ferry crosses the strait, and fireworks go off now and then, over a sky that
// goes from deep teal to a warm orange glow at the horizon. The accent is a lantern orange; red
// keeps meaning danger.
const { theme, problems } = makeColors({
  label: 'Penang',
  only: 'dark',
  roles: {
    accent: '#ff9e4a',
    danger: '#ff5d5d',
    success: '#5fd68a',
    warning: '#ffd24a',
    pro: '#a98bff',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#07111a',
        'surface-1': '#0b1621',
        'surface-2': '#101c29',
        'surface-3': '#152333',
        'text-primary': '#f1f5f8',
        'text-secondary': '#c6d0da',
        'text-muted': '#9fadbb',
      },
    },
  },
})

// The waterfront, in art pixels: the town stands on it, the strait runs below it.
const SHORE = 152

// ---------- sky ----------

// Deep teal overhead, warming through slate and rose to an orange glow over the town.
const SKY: Stops = [
  [0, '#06101c'],
  [22, '#0a1a2c'],
  [44, '#102a3f'],
  [66, '#183a50'],
  [86, '#2a4458'],
  [104, '#4a4a5c'],
  [118, '#6e5058'],
  [130, '#9a5a50'],
  [140, '#c8704a'],
  [148, '#e8944a'],
]

// ---------- fireworks (centred on their group's origin) ----------

// ---------- the mainland across the strait, right across ----------

// ---------- the Penang Bridge (its left end at the origin, foot on the shore) ----------

const DECK = -17

function bridge(): string {
  const a = new Art()
  const lights = [new Art(), new Art(), new Art()]
  const beacons = new Art()

  // The strait far off, the deck on its piers, then two H-shaped towers with fans of cables.
  a.rect(-6, -12, 170, 12, '#12303f')
  a.rect(-6, DECK, 170, 1, '#8aa4b8')
  a.rect(-6, DECK + 1, 170, 1, '#2a3f52')
  for (let x = -4; x < 164; x += 6) {
    a.rect(x, DECK + 2, 1, 5, '#2a3f52')
  }
  for (const tx of [14, 108]) {
    a.rect(tx - 3, DECK - 38, 2, 38, '#9fb4c6')
    a.rect(tx + 2, DECK - 38, 2, 38, '#9fb4c6')
    a.rect(tx - 3, DECK - 38, 7, 1, '#c6d4e0')
    a.rect(tx - 3, DECK - 30, 7, 1, '#9fb4c6')
    for (let k = 0; k < 8; k++) {
      const ay = DECK - 36 + k * 3
      const dx = 6 + k * 5

      a.line(tx, ay, tx - dx, DECK, '#5a7a98')
      a.line(tx, ay, tx + dx, DECK, '#5a7a98')
    }
    beacons.set(tx - 3, DECK - 40, '#ff4a4a')
    beacons.set(tx + 3, DECK - 40, '#ff4a4a')
  }
  // The deck's lights, in three sets that chase along it.
  for (let x = -4; x < 164; x += 3) {
    lights[(x / 3 + 40) % 3]?.set(x, DECK - 1, '#fff1c9')
  }

  return px(a.svg()) + lights.map((l, i) => px(l.svg(), `cap cap${i}`)).join('') + px(beacons.svg(), 'blink')
}

// ---------- Penang Hill, with the Kek Lok Si pagoda (foot of the hill's middle at its origin) ----------

const HILL_W = 62

function hillHeight(x: number): number {
  return Math.round(38 * Math.max(0, 1 - (x / HILL_W) ** 2) ** 0.8)
}

function hill(): string {
  const body = new Art()
  const pagoda = new Art()
  const lit = new Windows()
  const funicular = [new Art(), new Art()]
  const beacons = new Art()

  for (let x = -HILL_W; x <= HILL_W; x++) {
    const h = hillHeight(x)

    for (let y = 0; y <= h; y++) {
      body.set(x, -y, y === h ? '#1f4a44' : hash(x, y) < 0.07 ? '#1a3f3a' : '#0f2a2a')
    }
  }
  // The Kek Lok Si pagoda on the slope: seven tiers, each narrower, under tiled roofs.
  const px0 = -22
  let y = -hillHeight(px0) + 1
  const widths = [13, 11, 10, 9, 8, 7, 6]

  for (const w of widths) {
    const left = px0 - Math.floor(w / 2)

    pagoda.rect(left, y - 3, w, 3, '#efe4cc')
    pagoda.rect(left - 1, y - 4, w + 2, 1, '#e8a24a')
    pagoda.rect(left - 1, y - 3, 1, 1, '#c97a2a')
    pagoda.rect(left + w, y - 3, 1, 1, '#c97a2a')
    for (let wx = left + 1; wx < left + w - 1; wx += 2) {
      lit.still.set(wx, y - 2, '#ffd27a')
    }
    y -= 4
  }
  pagoda.rect(px0 - 1, y - 2, 3, 2, '#ffd24a')
  pagoda.rect(px0, y - 8, 1, 6, '#ffd24a')
  beacons.set(px0, y - 9, '#ff4a4a')
  // The summit: a small tower, and the funicular's lights climbing the slope to it.
  const top = -hillHeight(10)

  body.rect(10, top - 7, 2, 7, '#2a3f52')
  beacons.set(10, top - 8, '#ff4a4a')
  for (let k = 0; k < 16; k++) {
    const x = 10 + k
    const hx = hillHeight(x)

    funicular[k % 2]?.set(x, -hx - 1, '#fff1c9')
  }

  return (
    px(glow(px0, -40, 22, 34, 'g-gold', 0.4) + body.svg()) +
    px(pagoda.svg()) +
    lit.svg() +
    funicular.map((f, i) => px(f.svg(), `cap cap${i}`)).join('') +
    px(beacons.svg(), 'blink')
  )
}

// ---------- Komtar (centre of its foot at the origin) ----------

const KOMTAR_H = 70

// George Town's tallest tower: a round shaft, shaded as a cylinder, with a wider lit crown ring.
function komtar(): string {
  const rand = seeded(61)
  const body = new Art()
  const crown = new Art()
  const win = new Windows()
  const shades = ['#2e4570', '#4a6aa8', '#4a6aa8', '#4a6aa8', '#6a8ac8', '#6a8ac8', '#6a8ac8', '#4a6aa8', '#4a6aa8', '#2e4570', '#1a2a4a']

  body.rect(-17, -8, 35, 8, '#1c2442')
  body.rect(-17, -8, 35, 1, '#34406a')
  for (let x = -15; x <= 15; x += 3) {
    win.still.rect(x, -5, 2, 1, '#ffd27a')
    win.a.rect(x, -3, 2, 1, '#ffe9b8')
  }
  for (let t = 0; t < KOMTAR_H; t++) {
    const y = -t - 9

    for (let x = -5; x <= 5; x++) {
      body.set(x, y, shades[x + 5] ?? '#4a6aa8')
    }
    if (t % 3 === 2) {
      body.rect(-5, y, 11, 1, '#1a2a4a')
    }
  }
  win.fill(rand, -5, -KOMTAR_H - 9, 11, -10, [2, 2], [1, 1], 0.3, ['#ffd27a', '#fff0c2', '#9fe2ff'])
  // The crown: a wider ring, lit, under a short mast.
  const top = -KOMTAR_H - 9

  body.rect(-7, top - 1, 15, 4, '#2e4570')
  crown.rect(-7, top - 1, 15, 1, '#ffb15a')
  crown.rect(-7, top + 2, 15, 1, '#ffb15a')
  body.rect(-3, top - 3, 7, 2, '#4a6aa8')
  body.rect(0, top - 11, 1, 8, '#9fb4c6')
  crown.set(0, top - 12, '#ff4a4a')

  return px(glow(0, -40, 26, 48, 'g-blue', 0.35) + body.svg()) + win.svg() + px(crown.svg(), 'blink')
}

// ---------- George Town's shophouses (right edge, foot on the shore) ----------

const HOUSE_COLORS = ['#d98a9a', '#4aa8a0', '#e6c46a', '#6a8ad0', '#e8dcc0', '#d98a6a']

function shophouses(): string {
  const rand = seeded(73)
  const body = new Art()
  const roofs = new Art()
  const win = new Windows()

  HOUSE_COLORS.forEach((color, i) => {
    const x = -54 + i * 9

    body.rect(x, -12, 9, 12, color)
    body.rect(x + 8, -12, 1, 12, '#00000040')
    // A tiled roof, a shuttered upper floor and an arcade at the foot.
    roofs.rect(x - 1, -14, 11, 2, '#8a3a2a')
    roofs.rect(x, -15, 9, 1, '#a84a32')
    for (const wx of [x + 1, x + 5]) {
      body.rect(wx, -10, 2, 3, '#2a4a3a')
      if (rand() < 0.7) {
        win.still.rect(wx, -9, 2, 2, '#ffd27a')
      }
    }
    body.rect(x + 2, -4, 5, 4, '#3a2418')
    win.a.rect(x + 3, -3, 3, 3, '#ffb15a')
  })

  return px(glow(-27, -8, 34, 14, 'g-gold', 0.4) + body.svg() + roofs.svg()) + win.svg()
}

// ---------- the Clan Jetty (centre of the pier's foot at its origin) ----------

function jetty(): string {
  const a = new Art()
  const lanterns = [new Art(), new Art()]

  // A plank pier on stilts, with three houses on it under zinc roofs, a lantern at each door.
  a.rect(-64, 0, 64, 2, '#5a3a2a')
  a.rect(-64, 0, 64, 1, '#7a5a3a')
  for (let x = -62; x <= -2; x += 8) {
    a.rect(x, 2, 1, 6, '#3a2418')
  }
  for (let i = 0; i < 3; i++) {
    const x = -60 + i * 20
    const wall = i % 2 === 0 ? '#a9794f' : '#7a9ab0'

    a.rect(x, -9, 14, 9, wall)
    for (let r = 0; r < 4; r++) {
      a.rect(x - 1 + r, -13 + r, 16 - r * 2, 1, r === 0 ? '#9fb0b0' : '#6a8a8a')
    }
    a.rect(x + 5, -6, 4, 6, '#2a1810')
    a.rect(x + 2, -7, 2, 2, '#ffd27a')
    const lamp = lanterns[i % 2] ?? lanterns[0]

    lamp?.rect(x + 10, -8, 3, 4, '#e53935')
    lamp?.rect(x + 10, -9, 3, 1, '#ffd24a')
    lamp?.set(x + 11, -7, '#ffb15a')
  }
  // A sampan moored at the near end.
  a.rect(-74, -1, 10, 2, '#4a2a1a')
  a.rect(-71, -4, 1, 3, '#cfd8dc')

  return px(glow(-32, -6, 40, 14, 'g-red', 0.35) + a.svg()) + lanterns.map((l, i) => px(`<g class="sway-${i === 0 ? 'a' : 'b'}">${l.svg()}</g>`)).join('')
}

// ---------- the Penang ferry (centred on its waterline) ----------

function ferry(): string {
  const a = new Art()
  const win = new Art()

  for (let x = -14; x <= 14; x++) {
    a.set(x, -1, '#223a50')
    a.set(x, 0, Math.abs(x) > 12 ? '#16283a' : '#16283a')
  }
  a.rect(-12, -5, 25, 4, '#e8eef2')
  a.rect(-9, -8, 19, 3, '#cfd8dc')
  a.rect(-3, -11, 5, 3, '#b0bec5')
  a.rect(4, -11, 3, 3, '#e53935')
  for (let x = -11; x <= 11; x += 2) {
    win.set(x, -4, '#ffd27a')
  }
  for (let x = -8; x <= 8; x += 2) {
    win.set(x, -7, '#ffe9b8')
  }

  return px(`<g class="rock">${glow(0, -4, 18, 8, 'g-gold', 0.5)}${a.svg()}${win.svg()}</g>`)
}

// ---------- a string of lanterns over the waterfront (left end at the origin) ----------

function lanterns(): string {
  const a = new Art()
  const b = new Art()

  for (let i = 0; i < 10; i++) {
    const x = i * 6
    const sag = (n: number): number => Math.round(5 * Math.sin((Math.PI * n) / 10))
    const layer = i % 2 === 0 ? a : b

    layer.line(x, sag(i), x + 6, sag(i + 1), '#3a2418')
    layer.rect(x + 1, sag(i) + 1, 4, 5, '#e53935')
    layer.rect(x + 1, sag(i), 4, 1, '#ffd24a')
    layer.rect(x + 2, sag(i) + 2, 2, 2, '#ffb15a')
    layer.rect(x + 2, sag(i) + 6, 2, 1, '#ffd24a')
  }

  return px(glow(30, 4, 40, 10, 'g-red', 0.3)) + px(`<g class="sway-a">${a.svg()}</g>`) + px(`<g class="sway-b">${b.svg()}</g>`)
}

// ---------- the strait ----------

function water(): string {
  const a = new Art()

  a.rect(0, SHORE, GW, GH - SHORE, '#0a1c2a')
  a.rect(0, SHORE + 16, GW, GH - SHORE - 16, '#08161f')
  a.rect(0, SHORE + 32, GW, GH - SHORE - 32, '#06111a')
  ripples(a, SHORE + 3, GH, '#12303f')
  // The seawall, and the promenade's string of lamps along it.
  a.rect(0, SHORE - 1, GW, 2, '#1e3850')
  lampRow(a, SHORE - 2)

  return px(a.svg())
}

// ---------- layout ----------
//
// The bridge and the hill with its pagoda stand at the left (under the app's sidebar on a
// desktop), the ferry in the gap between the sidebar and the conversation, and Komtar, the
// shophouses, the lanterns and the jetty past the conversation on the right. Phones have no
// sidebar, so all of it draws in and shrinks.

type Spots = Record<'bridge' | 'hill' | 'ferry' | 'komtar' | 'town' | 'lanterns' | 'jetty' | 'fw1' | 'fw2', Spot>

const SHORE_Y = SHORE * PX

function spots(low: number, high: number): Spots {
  const { v, left, right, top, phone, s } = view(low, high)

  return {
    bridge: [left - 20 * s, SHORE_Y, s],
    hill: [left + v * (phone ? 0.36 : 0.2), SHORE_Y, s],
    ferry: [left + v * (phone ? 0.55 : 0.27), SHORE_Y + 70 * s, s],
    // Both Komtar and the town stand clear of the veil behind the conversation, which fades out by 88%.
    komtar: [right - v * (phone ? 0.2 : 0.115), SHORE_Y, s],
    town: [right, SHORE_Y, s],
    lanterns: [right - 60 * PX * s, SHORE_Y - 26 * PX * s, s],
    jetty: [right - 2 * PX * s, SHORE_Y + 110 * s, s],
    fw1: [left + v * 0.12, top + 90 * s, s],
    fw2: [right - v * 0.06, top + 110 * s, s],
  }
}

const { css: placement, placed } = layout(spots)

const SCENE = `${SVG_OPEN}
<defs>
${grad('g-gold', '#ffc66b', 0.5)}${grad('g-blue', '#5fa8ff', 0.4)}
${grad('g-red', '#ff6a4a', 0.4)}${scrimGradient('#07111a')}
</defs>
<style>
${placement}
${MOTION_CSS}${FIREWORK_CSS}
  /* The bridge's lights and the funicular's: sets lit in turn, so they seem to run. */
  .cap { animation: cap 1.8s step-end infinite; }
  .cap1 { animation-delay: -1.2s; }
  .cap2 { animation-delay: -0.6s; }
  @keyframes cap { 0% { opacity: 1; } 33% { opacity: 0.2; } }

  /* The lanterns sway: two sets, one up while the other is down. */
  .sway-a { animation: sway 2.4s step-end infinite; }
  .sway-b { animation: sway 2.4s step-end infinite; animation-delay: -1.2s; }
  @keyframes sway { 0% { transform: translateY(0); } 50% { transform: translateY(1px); } }

  .at-fw2 .burst { animation-delay: -5s; }
${calm('.star-a', '.star-b', '.blink', '.lit-a', '.lit-b', '.cloud', '.cap', '.sway-a', '.sway-b', '.glint-a', '.glint-b', '.rock', '.burst')}
</style>
${skyBands(SKY)}
${stars(23, 80, 96, ['#fff6e0', '#bcd0e0', '#6a8aa0'])}
${mist([[22, 104, 44], [150, 98, 58], [240, 110, 38], [98, 116, 32]], { top: '#1c3248', body: '#2c4258', lit: '#8a5848' })}
${placed('fw1', firework(5, ['#ffb15a', '#ff9e4a', '#8a5a2a']))}
${placed('fw2', firework(11, ['#8ff0e0', '#4fd8c0', '#2a6f6a']))}
${hazeCity(31, SHORE, [8, 24], { body: '#12263a', edge: '#1e3850', dim: '#2e4a66', warm: '#c49860' })}
${placed('bridge', bridge())}
${placed('hill', hill())}
${placed('komtar', komtar())}
${placed('town', shophouses())}
${placed('lanterns', lanterns())}
${water()}
${placed('bridge', reflection([[20, 6, '#cfe0ee', 8], [114, 6, '#cfe0ee', 8]]))}
${placed('hill', reflection([[-22, 5, '#ffd24a', 10]]))}
${placed('komtar', reflection([[0, 6, '#6a8ac8', 22], [0, 8, '#ffb15a', 4]]))}
${placed('town', reflection([[-45, 6, '#d98a9a', 8], [-27, 6, '#e6c46a', 8], [-9, 6, '#d98a6a', 8]]))}
${placed('ferry', reflection([[0, 10, '#ffd27a', 6]]))}
${placed('ferry', ferry())}
${placed('jetty', jetty())}
${SCRIM}
</svg>`

export const penang: LookSpec = {
  id: 'penang',
  label: 'Penang',
  description: 'Pixel-art George Town at dusk: Komtar, the Penang Bridge, Penang Hill and the Clan Jetty',
  problems,
  theme: {
    colors: theme,
    backdrop: { scene: 'penang', glass: { blur: 0, tint: '#07111a', opacity: 0.3 } },
  },
  scenes: {
    penang: {
      source: SCENE,
      alt: 'Pixel art of George Town, Penang, at dusk across the strait: the Penang Bridge with its cable-stayed towers and Penang Hill with the Kek Lok Si pagoda on the left, the Penang ferry crossing the water, and on the right Komtar tower with a lit crown, colorful shophouses, red lanterns and the Clan Jetty stilt houses, with fireworks in the sky',
    },
  },
}
