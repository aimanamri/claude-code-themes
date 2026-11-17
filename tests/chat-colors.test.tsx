import { expect, mock, test } from 'claude-code/testing'

import { CHAT_COLORS, dropLinks, hasColoredParts, inlineRuns, splitChat } from '../hooks/chat-colors'

// What counts as a heading or a quote, and what a reply looks like on screen in Petronas KL.

type On = Parameters<Extract<Parameters<typeof test>[1], (...args: never[]) => unknown>>[1]

test('a reply splits into plain text, headings and quotes, in order', async () => {
  const parts = splitChat('Intro line\n\n## Next steps\n\nSome text\n\n> A quote\n> over two lines\n\nTail')

  expect(parts).toEqual([
    { kind: 'text', text: 'Intro line' },
    { kind: 'heading', level: 2, text: 'Next steps' },
    { kind: 'text', text: 'Some text' },
    { kind: 'quote', text: 'A quote\nover two lines' },
    { kind: 'text', text: 'Tail' },
  ])
})

test('a # or a > inside a fenced code block is code, not a heading or a quote', async () => {
  const text = 'Run:\n\n```bash\n# a comment\necho "a" > file\n> not a quote\n```\n\nDone'

  expect(splitChat(text)).toEqual([{ kind: 'text', text }])
  expect(hasColoredParts(splitChat(text))).toBe(false)
})

test('a tilde fence and a longer fence close only on a matching fence', async () => {
  const text = '~~~\n# inside\n~~~\n\n````\n```\n# still inside\n```\n````\n\n# Outside'

  expect(splitChat(text).filter(part => part.kind === 'heading')).toEqual([{ kind: 'heading', level: 1, text: 'Outside' }])
})

test('a hash without a space, a hashtag and a comparison are not headings or quotes', async () => {
  expect(hasColoredParts(splitChat('#hashtag\n\nuse a > b and a>b\n\n#1 is first'))).toBe(false)
})

test('a heading keeps its level and loses its closing hashes', async () => {
  expect(splitChat('### Small ###')).toEqual([{ kind: 'heading', level: 3, text: 'Small' }])
})

test('a heading or a quote keeps its words but not its links', async () => {
  expect(dropLinks('See [the docs](https://x.test) and ![pic](a.png)')).toBe('See the docs and pic')
})

test('a line splits into runs: inline code, bold, italic and struck through', async () => {
  expect(inlineRuns('Run `ls -la` then **commit** the `a_b` file')).toEqual([
    { text: 'Run ' },
    { text: 'ls -la', code: true },
    { text: ' then ' },
    { text: 'commit', bold: true },
    { text: ' the ' },
    { text: 'a_b', code: true },
    { text: ' file' },
  ])
  expect(inlineRuns('an *em* and _em_ and ~~gone~~')).toEqual([
    { text: 'an ' },
    { text: 'em', italic: true },
    { text: ' and ' },
    { text: 'em', italic: true },
    { text: ' and ' },
    { text: 'gone', strike: true },
  ])
})

test('words with underscores and stars are not styled, a code span keeps its marks', async () => {
  expect(inlineRuns('set snake_case_name and 2*3*4')).toEqual([{ text: 'set snake_case_name and 2*3*4' }])
  expect(inlineRuns('use `**not bold**` and ``a ` b``')).toEqual([
    { text: 'use ' },
    { text: '**not bold**', code: true },
    { text: ' and ' },
    { text: 'a ` b', code: true },
  ])
})

test('a paragraph or a list with inline code is drawn by the hook, in one piece', async () => {
  expect(splitChat('Steps:\n- run `ls`\n- then `pwd`')).toEqual([{ kind: 'prose', lines: ['Steps:', '- run `ls`', '- then `pwd`'] }])
  expect(splitChat('One plain paragraph.\n\nA `code` paragraph.\n\nAnother plain one.')).toEqual([
    { kind: 'text', text: 'One plain paragraph.' },
    { kind: 'prose', lines: ['A `code` paragraph.'] },
    { kind: 'text', text: 'Another plain one.' },
  ])
})

test('a block with a link, a URL, a table, a rule, HTML or a fence is left to the app', async () => {
  for (const block of [
    'See [docs](https://x.test) and `code`',
    'Open https://x.test and `code`',
    '| a | `b` |\n| - | - |\n| 1 | 2 |',
    '---',
    'A `List<string>` type',
    '```js\nconst a = `x`\n```',
    '- item\n  ```sh\n  echo `date`\n  ```',
  ]) {
    expect(splitChat(block).some(part => part.kind === 'prose')).toBe(false)
  }
})

test('a fence inside a list item is code even when it is indented', async () => {
  const parts = splitChat('- step\n  ```sh\n  # not a heading\n  ```')

  expect(parts.some(part => part.kind === 'heading')).toBe(false)
})

test('only Petronas KL, Penang, Terengganu, Sepang, Kelantan and Kelantan Day have chat colors', async () => {
  expect(Object.keys(CHAT_COLORS)).toEqual(['petronas-kl', 'penang', 'terengganu', 'sepang', 'kelantan', 'kelantan-day'])
})

// WCAG contrast of two hex colors: 4.5 is the usual floor for body text.
function contrast(a: string, b: string): number {
  const lum = (hex: string): number => {
    const [r = 0, g = 0, bl = 0] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    const f = (c: number): number => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl)
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)

  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

test('the words of a quote and of inline code are readable on their own backgrounds, in every look', async () => {
  for (const [id, colors] of Object.entries(CHAT_COLORS)) {
    expect([id, contrast(colors.quote, colors.quoteBackground) >= 4.5]).toEqual([id, true])
    expect([id, contrast(colors.code, colors.codeBackground) >= 4.5]).toEqual([id, true])
  }
})

// The drawing: the engine's own draw of a reply stands beneath the plugin as a plain Text.
function engine(on: On, look: string): void {
  mock.store(on, { look })
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'test' } }))
  on('theme.clear', () => ({ value: { isDrawn: false, reason: 'cleared' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
}

const REPLY = (text: string, surface: 'desktop' | 'mobile' | 'terminal' | 'vscode') =>
  ({
    plugin: 'looks-malaysia',
    component: 'AssistantMessage',
    surface,
    props: { text, isFirstOfReply: true },
  }) as never

test('in Petronas KL a heading and a quote are drawn in their colors, on desktop and mobile', async ($, on) => {
  engine(on, 'petronas-kl')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of ['desktop', 'mobile'] as const) {
    const ui = await $.ui.mount(REPLY('Intro\n\n## Plan\n\n> Quoted words', surface))
    const heading = await ui.find({ type: 'Text', text: /Plan/ })
    const quote = await ui.find({ type: 'Text', text: /Quoted words/ })

    expect(heading?.props?.color).toBe(CHAT_COLORS['petronas-kl']?.heading)
    expect(quote?.props?.color).toBe(CHAT_COLORS['petronas-kl']?.quote)
    await ui.unmount()
  }
})

test('a reply with no heading or quote, and any other look, are left to the app', async ($, on) => {
  engine(on, 'petronas-kl')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const plain = await $.ui.mount(REPLY('Only plain words, a **bold** one', 'desktop'))

  expect((await plain.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await plain.unmount()

  for (const surface of ['terminal', 'vscode'] as const) {
    const ui = await $.ui.mount(REPLY('## Plan', surface))

    expect((await ui.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
    await ui.unmount()
  }
})

test('with the look off, a heading is not recolored', async ($, on) => {
  engine(on, 'off')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount(REPLY('## Plan', 'desktop'))

  expect((await ui.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await ui.unmount()
})

test('in Petronas KL inline code is gold on a dark gold, in a paragraph and in a list', async ($, on) => {
  engine(on, 'petronas-kl')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const gold = CHAT_COLORS['petronas-kl']

  const ui = await $.ui.mount(REPLY('Run `ls -la` now\n\n- first `item`\n- second', 'desktop'))
  const para = await ui.find({ type: 'Text', text: /^ls -la$/ })
  const item = await ui.find({ type: 'Text', text: /^item$/ })

  expect(para?.props?.color).toBe(gold?.code)
  expect(para?.props?.backgroundColor).toBe(gold?.codeBackground)
  expect(item?.props?.color).toBe(gold?.code)
  await ui.unmount()
})

const USER = (text: string, kind: string, surface: 'desktop' | 'mobile' | 'terminal' | 'vscode' = 'desktop') =>
  ({
    plugin: 'looks-malaysia',
    component: 'UserMessage',
    surface,
    props: { text, origin: { kind }, isExpanded: true },
  }) as never

test('in Petronas KL the person\'s own prompt gets the chat colors: typed, from a phone or from the desktop app', async ($, on) => {
  engine(on, 'petronas-kl')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const colors = CHAT_COLORS['petronas-kl']

  for (const kind of ['composer', 'bridge', 'sdk']) {
    const ui = await $.ui.mount(USER('## Ask\n\nRun `ls` and read\n\n> a quote', kind))

    expect((await ui.find({ type: 'Text', text: /Ask/ }))?.props?.color).toBe(colors?.heading)
    expect((await ui.find({ type: 'Text', text: /^ls$/ }))?.props?.color).toBe(colors?.code)
    expect((await ui.find({ type: 'Text', text: /a quote/ }))?.props?.color).toBe(colors?.quote)
    await ui.unmount()
  }
})

test('a task notification, a peer, a schedule, a plain prompt and other surfaces are left to the app', async ($, on) => {
  engine(on, 'petronas-kl')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const [text, kind, surface] of [
    ['## Done', 'task-notification', 'desktop'],
    ['## Hi', 'peer', 'desktop'],
    ['## Tick', 'scheduled-trigger', 'desktop'],
    ['Only plain words', 'composer', 'desktop'],
    ['## Plan', 'composer', 'terminal'],
    ['## Plan', 'composer', 'vscode'],
  ] as const) {
    const ui = await $.ui.mount(USER(text, kind, surface))

    expect((await ui.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
    await ui.unmount()
  }
})

test('with the look off, the person\'s prompt is not recolored', async ($, on) => {
  engine(on, 'off')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount(USER('## Plan', 'composer'))

  expect((await ui.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await ui.unmount()
})

test('the person\'s prompt is drawn in a bordered bubble on the right, a reply is not', async ($, on) => {
  engine(on, 'petronas-kl')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const prompt = await $.ui.mount(USER('## Ask', 'sdk'))
  const boxes = await prompt.findAll({ type: 'Box' })

  expect(boxes.some(box => box.props?.alignItems === 'flex-end')).toBe(true)
  expect(boxes.some(box => box.props?.borderStyle === 'round' && box.props?.alignSelf === 'flex-end')).toBe(true)
  await prompt.unmount()

  const reply = await $.ui.mount(REPLY('## Ask', 'desktop'))
  const replyBoxes = await reply.findAll({ type: 'Box' })

  expect(replyBoxes.some(box => box.props?.alignItems === 'flex-end' || box.props?.alignSelf === 'flex-end')).toBe(false)
  await reply.unmount()
})

test('in Penang a heading, a quote and inline code are drawn in the Penang colors', async ($, on) => {
  engine(on, 'penang')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const colors = CHAT_COLORS.penang

  const ui = await $.ui.mount(REPLY('## Plan\n\n> Quoted words\n\nRun `ls -la` now', 'desktop'))

  expect((await ui.find({ type: 'Text', text: /Plan/ }))?.props?.color).toBe(colors?.heading)
  expect((await ui.find({ type: 'Text', text: /Quoted words/ }))?.props?.color).toBe(colors?.quote)
  expect((await ui.find({ type: 'Text', text: /^ls -la$/ }))?.props?.color).toBe(colors?.code)
  expect(colors?.heading).not.toBe(CHAT_COLORS['petronas-kl']?.heading)
  await ui.unmount()
})

test('in Terengganu, a light look, a heading, a quote and inline code get the Terengganu colors', async ($, on) => {
  engine(on, 'terengganu')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const colors = CHAT_COLORS.terengganu

  const ui = await $.ui.mount(REPLY('## Plan\n\n> Quoted words\n\nRun `ls -la` now', 'desktop'))

  expect((await ui.find({ type: 'Text', text: /Plan/ }))?.props?.color).toBe(colors?.heading)
  expect((await ui.find({ type: 'Text', text: /Quoted words/ }))?.props?.color).toBe(colors?.quote)
  expect((await ui.find({ type: 'Text', text: /^ls -la$/ }))?.props?.color).toBe(colors?.code)
  await ui.unmount()
})

test('in Sepang a heading, a quote and inline code get the Sepang colors', async ($, on) => {
  engine(on, 'sepang')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const colors = CHAT_COLORS.sepang

  const ui = await $.ui.mount(REPLY('## Plan\n\n> Quoted words\n\nRun `ls -la` now', 'desktop'))

  expect((await ui.find({ type: 'Text', text: /Plan/ }))?.props?.color).toBe(colors?.heading)
  expect((await ui.find({ type: 'Text', text: /Quoted words/ }))?.props?.color).toBe(colors?.quote)
  expect((await ui.find({ type: 'Text', text: /^ls -la$/ }))?.props?.color).toBe(colors?.code)
  await ui.unmount()
})

test('in Kelantan a heading, a quote and inline code get the Kelantan colors', async ($, on) => {
  engine(on, 'kelantan')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const colors = CHAT_COLORS.kelantan

  const ui = await $.ui.mount(REPLY('## Plan\n\n> Quoted words\n\nRun `ls -la` now', 'desktop'))

  expect((await ui.find({ type: 'Text', text: /Plan/ }))?.props?.color).toBe(colors?.heading)
  expect((await ui.find({ type: 'Text', text: /Quoted words/ }))?.props?.color).toBe(colors?.quote)
  expect((await ui.find({ type: 'Text', text: /^ls -la$/ }))?.props?.color).toBe(colors?.code)
  await ui.unmount()
})

test('in Kelantan Day, a light look, a heading, a quote and inline code get its colors', async ($, on) => {
  engine(on, 'kelantan-day')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const colors = CHAT_COLORS['kelantan-day']

  const ui = await $.ui.mount(REPLY('## Plan\n\n> Quoted words\n\nRun `ls -la` now', 'desktop'))

  expect((await ui.find({ type: 'Text', text: /Plan/ }))?.props?.color).toBe(colors?.heading)
  expect((await ui.find({ type: 'Text', text: /Quoted words/ }))?.props?.color).toBe(colors?.quote)
  expect((await ui.find({ type: 'Text', text: /^ls -la$/ }))?.props?.color).toBe(colors?.code)
  await ui.unmount()
})
