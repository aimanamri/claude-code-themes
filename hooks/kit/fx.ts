// The drawing toolkit, part 3: pieces that several scenes share. Stars, fireworks, reflections,
// lit windows, a hazy far city, water ripples, mist, and the CSS for their motion.

import { Art, GW, hash, px, seeded } from './art'

// ---------- stars ----------

// A field of stars in the top `rows` rows, denser toward the top. Most stay still. A few twinkle,
// in two sets that dim in turn (classes star-a and star-b). `colors` are bright, mid and dim.
export function stars(seed: number, count: number, rows: number, colors: readonly [string, string, string]): string {
  const rand = seeded(seed)
  const fixed = new Art()
  const twinkling = [new Art(), new Art()]

  for (let n = 0; n < count; n++) {
    const [x, y] = [Math.trunc(rand() * GW), Math.trunc(rand() ** 1.6 * rows)]
    const brightness = rand()
    const color = brightness > 0.85 ? colors[0] : brightness > 0.5 ? colors[1] : colors[2]
    const flickers = brightness > 0.7 && n % 3 === 0

    ;(flickers ? (twinkling[n % 2] ?? fixed) : fixed).set(x, y, color)
  }

  return px(fixed.svg()) + px((twinkling[0] ?? fixed).svg(), 'star-a') + px((twinkling[1] ?? fixed).svg(), 'star-b')
}

// ---------- fireworks ----------

// One firework, centred on its group's origin, in three frames shown in turn (classes burst,
// burst-0, burst-1 and burst-2, timed by FIREWORK_CSS): the shell rising and popping, the sparks
// flung out with short trails, then the sparks drooping and fading. `colors` are bright, mid, dim.
export function firework(seed: number, colors: readonly [string, string, string]): string {
  const rand = seeded(seed)
  const [bright, mid, dim] = colors
  const [shell, bloom, droop] = [new Art(), new Art(), new Art()]

  shell.rect(-1, -1, 3, 3, mid)
  shell.set(0, 0, '#ffffff')
  for (let y = 2; y <= 7; y++) {
    shell.set(0, y, y < 4 ? mid : dim)
  }
  const sparks = 20

  for (let k = 0; k < sparks; k++) {
    const angle = (k / sparks) * Math.PI * 2 + (rand() - 0.5) * 0.25
    const reach = 7 + Math.round(rand() * 4)
    const [dx, dy] = [Math.cos(angle), Math.sin(angle)]

    // The head at full reach, with two cells of trail behind it.
    bloom.set(dx * reach, dy * reach, bright)
    bloom.set(dx * (reach - 1), dy * (reach - 1), mid)
    bloom.set(dx * (reach - 2), dy * (reach - 2), dim)
    // Later the head has flown on and sagged, and glows dim.
    const far = reach + 5

    droop.set(dx * far, dy * far + (far - 8) * 0.8, k % 3 === 0 ? bright : dim)
  }
  bloom.set(0, 0, '#ffffff')

  return [shell, bloom, droop].map((frame, n) => px(frame.svg(), `burst burst-${n}`)).join('')
}

// ---------- reflections ----------

// Pale streaks below what stands on the shore, as if lit things shone on the water. Each column is
// [centre x, half width, color, rows]. The streaks narrow and break up with depth, and shimmer in
// two sets (classes glint-a and glint-b). Drawn in the group of the thing they mirror, from the
// shore down.
export function reflection(columns: readonly (readonly [number, number, string, number])[], opacity = 0.3): string {
  const sets = [new Art(), new Art()]

  for (const [cx, half, color, rows] of columns) {
    for (let n = 0; n < rows; n++) {
      if (hash(cx, n, 9) < 0.22) {
        continue
      }
      const width = Math.max(1, Math.round(half * (1 - (0.55 * n) / rows)))
      const sway = Math.round((hash(n, cx, 3) - 0.5) * 3.5)

      sets[n % 2]?.rect(cx - width + sway, 3 + n * 2, width * 2, 1, color)
    }
  }
  const dimmed = (art: Art | undefined): string => `<g opacity="${opacity}">${art?.svg() ?? ''}</g>`

  return px(dimmed(sets[0]), 'glint-a') + px(dimmed(sets[1]), 'glint-b')
}

// ---------- a row of lamps ----------

// Small lamps along a line, one every `every` cells, from the right edge to the left.
export function lampRow(art: Art, y: number, every = 6, color = '#ffd98a'): void {
  for (let x = GW - 4; x > 0; x -= every) {
    art.set(x, y, color)
  }
}

// ---------- lit windows ----------

// Windows of a building, in three sets: most stay lit, and a few switch off and on at their own
// pace (classes lit-a and lit-b, timed by MOTION_CSS).
export class Windows {
  readonly still = new Art()
  readonly a = new Art()
  readonly b = new Art()

  // Fills a block that starts at (x, top) and is `w` wide, down to row `bottom`, with windows of
  // `size` every `pitch` cells. Each cell is lit with probability `chance`, in a color drawn at random.
  fill(
    rand: () => number,
    x: number,
    top: number,
    w: number,
    bottom: number,
    pitch: readonly [number, number],
    size: readonly [number, number],
    chance: number,
    colors: readonly string[],
  ): void {
    for (let y = top + 2; y + size[1] <= bottom; y += pitch[1]) {
      for (let col = x + 2; col + size[0] <= x + w - 1; col += pitch[0]) {
        const roll = rand()

        if (roll < chance) {
          const into = roll < chance * 0.12 ? this.a : roll < chance * 0.24 ? this.b : this.still

          into.rect(col, y, size[0], size[1], colors[Math.floor(rand() * colors.length)] ?? '#ffd27a')
        }
      }
    }
  }

  svg(): string {
    return px(this.still.svg()) + px(this.a.svg(), 'lit-a') + px(this.b.svg(), 'lit-b')
  }
}

// ---------- a far city ----------

// A hazy row of towers along the horizon, right across, with a few dim windows. `rows` is the
// range of tower heights in rows. `body` and `edge` color the towers and their roofs, and `dim` and
// `warm` the windows.
export function hazeCity(
  seed: number,
  shore: number,
  rows: readonly [number, number],
  colors: { body: string; edge: string; dim: string; warm: string },
): string {
  const rand = seeded(seed)
  const towers = new Art()
  const windows = new Windows()

  for (let left = -2; left < GW; ) {
    const width = 5 + Math.floor(rand() * 11)
    const height = rows[0] + Math.floor(rand() * (rows[1] - rows[0]))
    const roof = shore - height

    towers.rect(left, roof, width, height, colors.body)
    towers.rect(left, roof, width, 1, colors.edge)
    for (let y = roof + 2; y < shore - 1; y += 2) {
      for (let x = left + 1; x < left + width - 1; x += 2) {
        const roll = rand()

        if (roll < 0.1) {
          windows.still.set(x, y, colors.dim)
        } else if (roll < 0.13) {
          ;(roll < 0.12 ? windows.still : windows.a).set(x, y, colors.warm)
        }
      }
    }
    left += width
  }

  return px(towers.svg()) + windows.svg()
}

// ---------- mist ----------

// Low streaks of cloud or mist. Each is [x, y, length]. A streak is four rows, narrow at the top and
// bottom and widest in the middle, with a lit underside. They drift slowly (class cloud).
export function mist(streaks: readonly (readonly [number, number, number])[], colors: { top: string; body: string; lit: string }): string {
  const art = new Art()

  for (const [x, y, len] of streaks) {
    art.rect(x + 3, y, len - 6, 1, colors.top)
    art.rect(x + 1, y + 1, len - 2, 1, colors.body)
    art.rect(x, y + 2, len, 1, colors.body)
    art.rect(x + 2, y + 3, len - 4, 1, colors.lit)
  }

  return px(`<g class="cloud">${art.svg()}</g>`)
}

// ---------- water ----------

// Short dashes of `color` scattered over rows `from` to `to`, the ripples of water.
export function ripples(art: Art, from: number, to: number, color: string, salt = 0, density = 0.5): void {
  for (let y = from; y < to; y += 3) {
    for (let x = Math.floor(hash(y, salt) * 9); x < GW; x += 9 + Math.floor(hash(x, y, salt) * 6)) {
      if (hash(x, y, salt + 1) < density) {
        art.rect(x, y, 2 + Math.floor(hash(y, x, salt + 2) * 4), 1, color)
      }
    }
  }
}

// ---------- motion ----------

// A looping animation that steps (`step-end`), so a scene redraws only when a frame changes and the
// pixels stay crisp.
const stepped = (selector: string, name: string, seconds: number, delay = 0): string =>
  `${selector} { animation: ${name} ${seconds}s step-end infinite${delay === 0 ? '' : ` ${delay}s`}; }`

// The keyframes of an opacity animation: [percent, opacity] pairs.
const opacityFrames = (name: string, frames: readonly (readonly [number, number])[]): string =>
  `@keyframes ${name} { ${frames.map(([at, alpha]) => `${at}% { opacity: ${alpha}; }`).join(' ')} }`

// CSS for the shared classes: twinkling stars (star-a, star-b), a blinking beacon (blink), windows
// (lit-a, lit-b), drifting cloud (cloud), shimmering reflections (glint-a, glint-b) and a rocking
// boat (rock). `flip` is a keyframe for two sets shown in turn: one lit while the other is dark.
export const MOTION_CSS = [
  stepped('.star-a', 'fade', 7),
  stepped('.star-b', 'fade', 7, -3.5),
  opacityFrames('fade', [[0, 1], [50, 0.3]]),
  stepped('.blink', 'blink', 2),
  opacityFrames('blink', [[0, 1], [40, 0.15]]),
  stepped('.lit-a', 'flick', 11),
  stepped('.lit-b', 'flick', 15, -6),
  opacityFrames('flick', [[0, 1], [50, 0], [78, 1]]),
  '.cloud { animation: slide 90s steps(14) infinite alternate; }',
  '@keyframes slide { to { transform: translateX(14px); } }',
  stepped('.glint-a', 'fade', 1.8),
  stepped('.glint-b', 'fade', 1.8, -0.9),
  stepped('.rock', 'rock', 2.6),
  '@keyframes rock { 50% { transform: translateY(1px); } }',
  opacityFrames('flip', [[0, 1], [50, 0]]),
]
  .map(line => `  ${line}`)
  .join('\n')

// CSS for fireworks: each burst has its own slot in a 12-second cycle. Put `.at-<name> .burst {
// animation-delay: ... }` rules in the scene to start the bursts at different times.
export const FIREWORK_CSS = [
  '.burst { animation: 12s step-end infinite; }',
  '.burst-0, .burst-2 { opacity: 0; }',
  '.burst-0 { animation-name: b0; } .burst-1 { animation-name: b1; } .burst-2 { animation-name: b2; }',
  opacityFrames('b0', [[0, 1], [3, 0]]),
  opacityFrames('b1', [[0, 0], [3, 1], [8, 0]]),
  opacityFrames('b2', [[0, 0], [8, 1], [11, 0.6], [14, 0]]),
]
  .map(line => `  ${line}`)
  .join('\n')

// A rule that stops the given classes moving, for people who ask for reduced motion.
export const calm = (...selectors: string[]): string => `  @media (prefers-reduced-motion: reduce) {\n    ${selectors.join(', ')} { animation: none; }\n  }`
