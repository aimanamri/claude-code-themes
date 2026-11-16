import type { EngineInterface, Register } from 'claude-code'

import { CHAT_COLORS, type ChatColors } from './chat-colors'
import { chatTree } from './chat-view'
import { FIRST_LOOK, LOOKS } from './looks/index'
import type { LookSpec } from './looks/types'

// ---------- the shared choice ----------
//
// Which look is in use is one small fact, shared by every chat. It lives in a file in the person's
// home folder, ~/.claude/looks-malaysia.json. A chat that picks a look writes it, and every open
// chat checks the file now and then and applies a newer pick, so a switch in one chat shows in the
// others. The plugin's own store keeps a copy, for a machine where the file cannot be written.

type Engine = EngineInterface

const CHOICE_FILE = '.claude/looks-malaysia.json'
const SAVED_KEY = 'look'
const OFF = 'off'
const CHECK_EVERY_MS = 4000

const lookById = (id: string): LookSpec | undefined => LOOKS.find(look => look.id === id)
const isChoice = (value: unknown): value is string => typeof value === 'string' && (value === OFF || lookById(value) !== undefined)

// What this chat has drawn so far: the look, and the modified time of the file when it last checked.
// Both start over on a reload, which runs session.start again.
const here = { look: undefined as string | undefined, checkedAt: -1 }

async function choiceFile($: Engine): Promise<string | undefined> {
  try {
    const base = await $.env.get('HOME')

    return base === undefined || base === '' ? undefined : `${base}/${CHOICE_FILE}`
  } catch {
    return undefined
  }
}

// The look that should be in use: the file's, else the store's, else the first look.
async function currentChoice($: Engine): Promise<string> {
  const file = await choiceFile($)

  if (file !== undefined) {
    try {
      const { look } = JSON.parse(await $.fs.read(file)) as { look?: unknown }

      if (isChoice(look)) {
        return look
      }
    } catch {
      // There is no file yet, or it cannot be read.
    }
  }
  const saved = await $.store.get(SAVED_KEY)

  return isChoice(saved) ? saved : FIRST_LOOK
}

async function saveChoice($: Engine, id: string): Promise<void> {
  await $.store.set(SAVED_KEY, id)
  const file = await choiceFile($)

  if (file === undefined) {
    return
  }
  try {
    await $.fs.write(file, `${JSON.stringify({ look: id })}\n`)
    here.checkedAt = (await $.fs.stat(file)).mtimeMs
  } catch {
    // The store still has it.
  }
}

// ---------- drawing a look ----------

// Hands the look to the app, or clears the theme for "off". Answers one line for the person. A line
// that starts with "Look" means that it worked.
async function show($: Engine, id: string): Promise<string> {
  if (id === OFF) {
    await $.theme.clear()
    here.look = OFF

    return 'Look: off. The app’s own theme is back.'
  }
  const look = lookById(id)

  if (look === undefined) {
    return `No look named "${id}".`
  }
  const blocker = look.problems?.find(note => note.startsWith("Desktop won't paint"))

  if (blocker !== undefined) {
    return `${look.label} was not applied. ${blocker}`
  }
  try {
    const result = await $.theme.set(look.theme)

    here.look = id

    return result.isDrawn ? `Look: ${look.label}.` : `Look: ${look.label}. It is saved, but nothing draws it here: ${result.reason}`
  } catch (failure) {
    return `${look.label} was not applied. ${failure instanceof Error ? failure.message : String(failure)}`
  }
}

// Looks at the shared file, and draws the look in it if it is newer than the last one seen.
async function catchUp($: Engine, force: boolean): Promise<void> {
  const file = await choiceFile($)

  if (file === undefined) {
    return
  }
  try {
    const changedAt = (await $.fs.stat(file)).mtimeMs

    if (changedAt === here.checkedAt && !force) {
      return
    }
    here.checkedAt = changedAt
  } catch {
    return
  }
  const wanted = await currentChoice($)

  if (wanted !== here.look) {
    await show($, wanted)
  }
}

// ---------- the /look command ----------

// Every choice in the order of the list: each look, then "off". A number picks by this order.
const allChoices = (): string[] => [...LOOKS.map(look => look.id), OFF]

function menu(inUse: string): string {
  const rows = allChoices().map((id, n) => {
    const mark = id === inUse ? '●' : '○'
    const what = id === OFF ? 'the app’s own theme' : (lookById(id)?.description ?? '')

    return `${mark} ${n + 1}. ${id}: ${what}`
  })

  return ['Looks (● is the one in use, in every chat):', ...rows, '', 'Pick one with /look <name or number>. Use /look next to go on to the next.'].join('\n')
}

// What the words after /look ask for: the menu, or a look (or "off") by name.
function parseAsk(words: string, inUse: string): { menu: true } | { pick: string } | { unknown: string } {
  const asked = words.trim().toLowerCase()
  const choices = allChoices()

  if (['', 'list'].includes(asked)) {
    return { menu: true }
  }
  const wanted = asked === 'next' ? choices[(choices.indexOf(inUse) + 1) % choices.length] : /^\d+$/.test(asked) ? choices[Number(asked) - 1] : asked

  return wanted !== undefined && isChoice(wanted) ? { pick: wanted } : { unknown: asked }
}

async function runLook($: Engine, words: string): Promise<{ text: string }> {
  const inUse = await currentChoice($)
  const ask = parseAsk(words, inUse)

  if ('menu' in ask) {
    return { text: menu(inUse) }
  }
  if ('unknown' in ask) {
    return { text: `No look named "${ask.unknown}".\n\n${menu(inUse)}` }
  }
  const answer = await show($, ask.pick)

  if (answer.startsWith('Look')) {
    await saveChoice($, ask.pick)
  }

  return { text: answer }
}

// ---------- the plugin ----------

const colorsNow = (): ChatColors | undefined => (here.look === undefined ? undefined : CHAT_COLORS[here.look])

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({ name: 'look', description: 'List and switch looks', argumentHint: '[name | number | next | off]', immediate: true })
    } catch {
      // Another plugin has the name already, and answers it.
    }
    const id = await currentChoice($)

    if (id === OFF) {
      here.look = OFF
    } else {
      const answer = await show($, id)

      if (!answer.startsWith('Look')) {
        $.ui.toast(answer)
      }
    }
    try {
      const file = await choiceFile($)

      here.checkedAt = file === undefined ? -1 : (await $.fs.stat(file)).mtimeMs
    } catch {
      here.checkedAt = -1
    }
    try {
      $.clock.every(CHECK_EVERY_MS, () => {
        void catchUp($, false)
      })
    } catch {
      // There are no timers here. The chat still catches up when the app attaches.
    }

    return next(e)
  })

  // The app opens or reopens this chat: catch up with a pick made somewhere else.
  on('session.attach', async ($, e, next) => {
    const result = await next(e)

    void catchUp($, true)

    return result
  })

  on('command.run', { command: 'look' }, ($, e) => runLook($, e.args))

  // The moving scene named by the backdrop of the look in use.
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const scene = LOOKS.map(look => look.scenes[e.props.scene]).find(found => found !== undefined)

    if (scene === undefined) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={scene.source} alt={scene.alt} isInteractive />
  })

  // Chat colors. When the look in use has them, headings, quotes and inline code stand out from the
  // normal text. A message with nothing to color, a look without chat colors, and a surface that
  // draws no looks are left to the app.
  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    const colors = colorsNow()

    if (colors === undefined || e.props.isSummary === true || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    return chatTree($, e, e.props.text, colors) ?? next(e)
  })

  // The person's own prompt: typed at a terminal ('composer'), sent from a phone ('bridge'), or sent
  // by a host program such as the desktop app ('sdk'). A task notification, a peer's message or a
  // scheduled prompt is not theirs, so it is left to the app.
  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    const colors = colorsNow()
    const origin = e.props.origin.kind

    if (colors === undefined || (origin !== 'composer' && origin !== 'bridge' && origin !== 'sdk') || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const tree = chatTree($, e, e.props.text, colors)

    if (tree === undefined) {
      return next(e)
    }
    const { Box } = $.ui.resolve(e)

    // The app draws the person's prompt in a bordered bubble on the right. Drawing it here would lose
    // that, and the prompt would read like a reply on the left, so it gets the bubble back.
    return (
      <Box flexDirection="column" alignItems="flex-end">
        <Box alignSelf="flex-end" borderStyle="round" borderColor="subtle" paddingX={1}>
          {tree}
        </Box>
      </Box>
    )
  })
}
