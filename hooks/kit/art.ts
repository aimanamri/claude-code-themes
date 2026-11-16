// The drawing toolkit, part 1: a pixel canvas and small SVG helpers.
//
// A scene is an SVG of W by H units. It is drawn on a grid of "art pixels", each PX units wide, so
// every helper here works in art pixels. An `Art` collects colored cells. `svg()` packs them into
// a few rectangles per color, and `px()` scales the result up to scene units.

export const PX = 5
export const W = 1600
export const H = 1000
export const GW = Math.floor(W / PX) // the grid is 320 cells wide
export const GH = Math.floor(H / PX) // and 200 cells tall

// ---------- a canvas of cells ----------

export class Art {
  // Row by row: y -> (x -> color). Rows are looked up far more often than columns.
  private readonly rows = new Map<number, Map<number, string>>()

  set(x: number, y: number, color: string | undefined): void {
    const [col, row] = [Math.round(x), Math.round(y)]

    if (color === undefined) {
      this.rows.get(row)?.delete(col)

      return
    }
    const cells = this.rows.get(row) ?? new Map<number, string>()

    this.rows.set(row, cells)
    cells.set(col, color)
  }

  has(x: number, y: number): boolean {
    return this.rows.get(Math.round(y))?.has(Math.round(x)) === true
  }

  rect(x: number, y: number, width: number, height: number, color: string): void {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        this.set(x + dx, y + dy, color)
      }
    }
  }

  // A filled circle. The small bias keeps tiny radii from collapsing to a single cell.
  disc(x: number, y: number, radius: number, color: string): void {
    const reach = Math.ceil(radius)

    for (let dy = -reach; dy <= reach; dy++) {
      for (let dx = -reach; dx <= reach; dx++) {
        if (dx * dx + dy * dy <= radius * radius + radius / 2) {
          this.set(x + dx, y + dy, color)
        }
      }
    }
  }

  // A straight run of cells from one point to another.
  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)

    for (let i = 0; i <= steps; i++) {
      this.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, color)
    }
  }

  // The cells as SVG paths, one <path> per color. For each color the cells are covered greedily
  // with rectangles: take the leftmost unused cell of the top row, run right as far as the cells go,
  // then grow the run downward while the rows below hold the same run.
  svg(): string {
    const perColor = new Map<string, Map<number, Set<number>>>()

    for (const [y, cells] of this.rows) {
      for (const [x, color] of cells) {
        const rowsOfColor = perColor.get(color) ?? new Map<number, Set<number>>()

        perColor.set(color, rowsOfColor)
        const xs = rowsOfColor.get(y) ?? new Set<number>()

        rowsOfColor.set(y, xs)
        xs.add(x)
      }
    }
    const paths: string[] = []

    for (const [color, rowsOfColor] of perColor) {
      let d = ''

      for (const y of [...rowsOfColor.keys()].sort((p, q) => p - q)) {
        const xs = [...(rowsOfColor.get(y) ?? [])].sort((p, q) => p - q)
        let at = 0

        while (at < xs.length) {
          const start = xs[at] ?? 0
          let width = 1

          while (xs[at + width] === start + width) {
            width++
          }
          at += width
          let height = 1

          while (covers(rowsOfColor, y + height, start, width)) {
            height++
          }
          for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
              rowsOfColor.get(y + dy)?.delete(start + dx)
            }
          }
          d += `M${start} ${y}h${width}v${height}h-${width}z`
        }
      }
      paths.push(`<path fill="${color}" d="${d}"/>`)
    }

    return paths.join('')
  }
}

// Whether row `y` holds every cell from `start` for `width` cells.
function covers(rows: Map<number, Set<number>>, y: number, start: number, width: number): boolean {
  const row = rows.get(y)

  if (row === undefined) {
    return false
  }
  for (let x = start; x < start + width; x++) {
    if (!row.has(x)) {
      return false
    }
  }

  return true
}

// ---------- SVG helpers ----------

// An Art's paths, scaled from art pixels to scene units, in a group with an optional class.
export const px = (inner: string, cls?: string): string => `<g${cls === undefined ? '' : ` class="${cls}"`} transform="scale(${PX})">${inner}</g>`

// A radial gradient: `color` at `opacity` in the middle, fading to nothing at the rim. For `glow`.
export function grad(id: string, color: string, opacity: number): string {
  const stop = (offset: number, alpha: number): string => `<stop stop-opacity="${alpha}" stop-color="${color}" offset="${offset}"/>`

  return `<radialGradient id="${id}">${stop(0, opacity)}${stop(1, 0)}</radialGradient>`
}

// A soft ellipse of light, in art pixels, filled with a gradient from `grad`.
export function glow(cx: number, cy: number, rx: number, ry: number, gradId: string, opacity = 1): string {
  return `<ellipse opacity="${opacity}" fill="url(#${gradId})" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`
}

// ---------- chance ----------

// A number from 0 up to 1 that depends only on its inputs: the same cell gives the same value.
export function hash(x: number, y: number, salt = 0): number {
  let h = Math.imul(Math.trunc(x), 374761393) ^ Math.imul(Math.trunc(y), 668265263) ^ Math.imul(Math.trunc(salt) + 1, 1442695041)

  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16

  return (h >>> 0) / 4294967296
}

// A generator of numbers from 0 up to 1 that depends only on its start value.
export function seeded(start: number): () => number {
  let state = Math.trunc(start) >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state

    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
