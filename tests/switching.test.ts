import { expect, mock, test } from 'claude-code/testing'

import { LOOKS } from '../hooks/looks/index'

// How /look lists and switches looks, what it saves, and how a chat follows a pick made elsewhere.
// The numbers come from LOOKS, so adding a look does not break these tests.

type On = Parameters<typeof mock.env>[0]

const FILE = '/home/test/.claude/looks-malaysia.json'
const ids = LOOKS.map(look => look.id)
const OFF = ids.length + 1 // the number of "off" in the list

// An in-memory disk with the shared file, the store, and a record of what the app was given.
function setup(on: On, options: { file?: string; stored?: string } = {}) {
  const disk = { text: options.file, mtime: options.file === undefined ? 0 : 1 }
  const given: string[] = []
  const clock = mock.clock(on)

  mock.env(on, { HOME: '/home/test' })
  mock.store(on, options.stored === undefined ? {} : { look: options.stored })
  on('fs.read', (_, e) => {
    if (e.path !== FILE || disk.text === undefined) {
      throw new Error('ENOENT')
    }

    return { value: disk.text }
  })
  on('fs.write', (_, e) => {
    disk.text = e.text
    disk.mtime += 1

    return { value: undefined }
  })
  on('fs.stat', (_, e) => {
    if (e.path !== FILE || disk.text === undefined) {
      throw new Error('ENOENT')
    }

    return { value: { mtimeMs: disk.mtime, size: disk.text.length, kind: 'file' } as never }
  })
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('theme.set', (_, e) => {
    given.push(String((e as { backdrop?: { scene?: string } }).backdrop?.scene ?? ''))

    return { value: { isDrawn: true, requestId: 'test' } }
  })
  on('theme.clear', () => {
    given.push('clear')

    return { value: { isDrawn: false, reason: 'cleared' } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.attach', (_, e) => ({ clientId: e.clientId }))

  return { disk, given, clock }
}

const run = (args: string) => ({ command: 'look', args }) as never

test('the list numbers every look, then off, and marks the first look when nothing was picked', async ($, on) => {
  setup(on)
  const text = (await $.command.run(run(''))).text

  ids.forEach((id, i) => {
    expect(text).toContain(`${i === 0 ? '●' : '○'} ${i + 1}. ${id}`)
  })
  expect(text).toContain(`○ ${OFF}. off`)
})

test('a look is picked by name and by number, and the pick is saved in the shared file', async ($, on) => {
  const { disk } = setup(on)

  expect((await $.command.run(run(ids[1] ?? ''))).text).toMatch(/^Look: /)
  expect(JSON.parse(disk.text ?? '{}')).toEqual({ look: ids[1] })
  expect((await $.command.run(run(''))).text).toContain(`● 2. ${ids[1]}`)

  expect((await $.command.run(run('3'))).text).toMatch(/^Look: /)
  expect((await $.command.run(run(''))).text).toContain(`● 3. ${ids[2]}`)
})

test('next goes through every look, then off, then back to the first', async ($, on) => {
  setup(on)
  const seen: string[] = []

  for (let i = 0; i < ids.length + 1; i++) {
    await $.command.run(run('next'))
    seen.push(((await $.command.run(run(''))).text ?? '').split('\n').find(line => line.startsWith('●')) ?? '')
  }

  expect(seen[0]).toContain(`2. ${ids[1]}`)
  expect(seen[ids.length - 1]).toContain(`${OFF}. off`)
  expect(seen[ids.length]).toContain(`1. ${ids[0]}`)
})

test('asking for a look that is not there leaves everything as it was', async ($, on) => {
  const { disk, given } = setup(on, { file: `{"look":"${ids[1]}"}\n` })

  expect((await $.command.run(run('aurora'))).text).toContain('No look named "aurora"')
  expect((await $.command.run(run(String(OFF + 5)))).text).toContain(`No look named "${OFF + 5}"`)
  expect((await $.command.run(run(''))).text).toContain(`● 2. ${ids[1]}`)
  expect(disk.text).toBe(`{"look":"${ids[1]}"}\n`)
  expect(given).toEqual([])
})

test('off clears the theme, and a chat that starts later keeps it off', async ($, on) => {
  const { given } = setup(on)

  expect((await $.command.run(run('off'))).text).toContain('off')
  expect(given).toEqual(['clear'])
  expect((await $.command.run(run(''))).text).toContain(`● ${OFF}. off`)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(given).toEqual(['clear'])
})

test('a new chat starts with the look that was picked last', async ($, on) => {
  const { given } = setup(on, { file: `{"look":"${ids[3]}"}\n` })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(given[0]?.startsWith(`${ids[3]}-`)).toBe(true)
})

test('the shared file wins over the store, and a name that no longer exists falls back to the first look', async ($, on) => {
  setup(on, { file: `{"look":"${ids[2]}"}\n`, stored: ids[1] })
  expect((await $.command.run(run(''))).text).toContain(`● 3. ${ids[2]}`)
})

test('a stored name that no longer exists falls back to the first look', async ($, on) => {
  setup(on, { stored: 'retired-look' })
  expect((await $.command.run(run(''))).text).toContain(`● 1. ${ids[0]}`)
})

test('an open chat follows a pick made in another chat when the app attaches', async ($, on) => {
  const { disk, given, clock } = setup(on, { file: `{"look":"${ids[0]}"}\n` })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(given).toHaveLength(1)

  // Another chat picks a look: the file changes on disk.
  disk.text = `{"look":"${ids[1]}"}\n`
  disk.mtime += 1
  await $.session.attach({ surface: 'desktop', clientId: 'desktop:default' } as never)
  await clock.settle()

  expect(given[1]?.startsWith(`${ids[1]}-`)).toBe(true)
})

test('an open chat also follows a pick made in another chat by checking the file on a timer', async ($, on) => {
  const { disk, given, clock } = setup(on, { file: `{"look":"${ids[0]}"}\n` })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  disk.text = `{"look":"${ids[2]}"}\n`
  disk.mtime += 1
  await clock.advance(5000)
  await clock.settle()

  expect(given[given.length - 1]?.startsWith(`${ids[2]}-`)).toBe(true)
})

test('every look draws a scene that its theme names, and the name changes with the drawing', async () => {
  for (const look of LOOKS) {
    const named = look.theme.backdrop !== undefined && 'scene' in look.theme.backdrop ? look.theme.backdrop.scene : undefined

    expect(named).toMatch(new RegExp(`^${look.id}-[0-9a-z]+$`))
    expect(Object.keys(look.scenes)).toContain(named)
  }
})

test('no scene is longer than the app takes, and no theme is one the desktop will not paint', async () => {
  for (const look of LOOKS) {
    for (const scene of Object.values(look.scenes)) {
      expect(scene.source.length).toBeLessThan(131072)
    }
    expect((look.problems ?? []).filter(line => line.startsWith("Desktop won't paint"))).toEqual([])
  }
})
