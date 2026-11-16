import { expect, test } from 'claude-code/testing'

import { Art, H, W, hash, layout, seeded, skyBands, view, visible } from '../hooks/kit'

// The drawing toolkit: packing cells into paths, chance, which part of a scene shows, and the layout CSS.

test('a block of one color becomes one rectangle, and two colors become two paths', async () => {
  const a = new Art()

  a.rect(0, 0, 3, 2, '#f00')
  expect(a.svg()).toBe('<path fill="#f00" d="M0 0h3v2h-3z"/>')

  a.rect(5, 5, 1, 1, '#0f0')
  expect(a.svg().match(/<path /g)).toHaveLength(2)
})

test('an L shape is covered exactly, with no cell drawn twice and none missed', async () => {
  const a = new Art()

  a.rect(0, 0, 4, 1, '#123456')
  a.rect(0, 1, 1, 3, '#123456')
  const cells = new Set<string>()
  const d = /d="([^"]+)"/.exec(a.svg())?.[1] ?? ''

  for (const m of d.matchAll(/M(\d+) (\d+)h(\d+)v(\d+)/g)) {
    const [x, y, w, h] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]

    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        expect(cells.has(`${x + i},${y + j}`)).toBe(false)
        cells.add(`${x + i},${y + j}`)
      }
    }
  }
  expect(cells.size).toBe(7)
})

test('set, has and clearing a cell, and a disc and a line', async () => {
  const a = new Art()

  a.set(2, 3, '#fff')
  expect(a.has(2, 3)).toBe(true)
  a.set(2, 3, undefined)
  expect(a.has(2, 3)).toBe(false)
  a.disc(10, 10, 3, '#fff')
  expect(a.has(10, 10) && a.has(13, 10) && a.has(10, 7)).toBe(true)
  expect(a.has(14, 10)).toBe(false)
  a.line(0, 0, 5, 5, '#fff')
  expect(a.has(0, 0) && a.has(3, 3) && a.has(5, 5)).toBe(true)
})

test('hash and seeded depend only on their inputs, and stay from 0 up to 1', async () => {
  expect(hash(4, 9, 2)).toBe(hash(4, 9, 2))
  expect(hash(4, 9, 2)).not.toBe(hash(9, 4, 2))
  const [first, again] = [seeded(7), seeded(7)]

  for (let i = 0; i < 50; i++) {
    const n = first()

    expect(n).toBe(again())
    expect(n >= 0 && n < 1).toBe(true)
    expect(hash(i, i * 3) >= 0 && hash(i, i * 3) < 1).toBe(true)
  }
})

test('visible gives the part of the scene a window of that shape shows', async () => {
  expect(visible(1.6)).toEqual({ v: W, left: 0, right: W })
  expect(visible(3).v).toBe(W)
  expect(visible(1).v).toBe(H)
  expect(visible(1).left).toBe((W - H) / 2)
  expect(visible(0.5).v).toBe(H * 0.5)
})

test('the layout makes a rule for every landmark in every window shape, and the veil', async () => {
  const { css, placed } = layout((low, high) => ({ tower: [low * 100, 500, 1] as [number, number, number], flag: [high * 100, 500, 0.5] as [number, number, number] }))

  expect(css.match(/@media/g)).toHaveLength(10)
  expect(css).toContain('.at-tower')
  expect(css).toContain('.at-flag')
  expect(css).toContain('.at-veil')
  expect(placed('tower', '<i/>')).toMatch(/^<g class="at-tower" transform="translate\(\d+ 500\) scale\(1\.00\)"><i\/><\/g>$/)
})

test('the sky is a band of color for every row, and stays a short path', async () => {
  const svg = skyBands([[0, '#000000'], [100, '#ffffff']])

  expect(svg).toContain('#000000')
  expect(svg).toContain('#ffffff')
  expect(svg.length).toBeLessThan(2000)
})

test('view says what shows, how big to draw, and that a phone is narrow', async () => {
  const desktop = view(1.45, 1.7)

  expect(desktop.phone).toBe(false)
  expect(desktop.v).toBe(1450)
  expect(desktop.s).toBeGreaterThan(0.6)
  expect(desktop.s).toBeLessThanOrEqual(1)
  expect(view(0.45, 0.6).phone).toBe(true)
  expect(view(0.45, 0.6).s).toBe(0.45)
  // A very wide window shows only the middle rows of the scene.
  expect(view(2.4, 3).top).toBeGreaterThan(0)
  expect(view(1.05, 1.25).top).toBe(0)
})
