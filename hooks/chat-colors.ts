// Colors for the chat text of a look, so headings, quotes and inline code stand out from normal text.
//
// A theme holds only palettes (gray, accent, roles), so it cannot color a heading, a quote or a
// span of inline code on its own. This file splits a reply into parts. register.tsx draws the
// parts it can color itself, and leaves the rest to the app's own markdown renderer.

export type Part =
  // Markdown the app draws as it always did: plain paragraphs, fences, tables, links, rules.
  | { kind: 'text'; text: string }
  // A paragraph or a list the hook draws itself, because it holds inline code to color.
  | { kind: 'prose'; lines: string[] }
  | { kind: 'heading'; text: string; level: number }
  | { kind: 'quote'; text: string }

export type ChatColors = {
  heading: string
  quote: string
  quoteBorder: string
  quoteBackground: string
  code: string
  codeBackground: string
}

// Looks that color the chat, by look id. Any other look draws the chat as it always did.
export const CHAT_COLORS: Readonly<Record<string, ChatColors>> = {
  'petronas-kl': {
    // The yellow of the flag's crescent, the look's accent.
    heading: '#f2c230',
    // A pale teal for the words of a quote, a deeper teal for its frame, a dark blue behind it.
    quote: '#8fe3d8',
    quoteBorder: '#2ed3c6',
    quoteBackground: '#0e2230',
    // Inline code: gold on a dark gold, easy to read on the dark look.
    code: '#ffd45e',
    codeBackground: '#2b2310',
  },
  penang: {
    // The look's lantern orange.
    heading: '#ff9e4a',
    // Pale peach words in an orange frame on dark brown, like a lantern's glow.
    quote: '#ffd9b0',
    quoteBorder: '#ff9e4a',
    quoteBackground: '#2a1a10',
    // Inline code: the strait's teal on a dark teal, so it stands out from the orange.
    code: '#7ee0d0',
    codeBackground: '#0e2a2c',
  },
  // A light look, so every color is dark enough to read on a pale page.
  terengganu: {
    // Songket maroon.
    heading: '#a8323f',
    // Dark brown words in a gold frame on cream, like gold thread on cloth.
    quote: '#5a3d10',
    quoteBorder: '#c8962a',
    quoteBackground: '#fbf0d8',
    // Inline code: the sea's deep teal on a pale teal.
    code: '#0b6a70',
    codeBackground: '#d3eef0',
  },
  sepang: {
    // The PETRONAS teal.
    heading: '#00d2be',
    // Pale pink words in a racing-red frame on dark red, like a red flag.
    quote: '#ffd6d6',
    quoteBorder: '#ff3b3b',
    quoteBackground: '#2a1214',
    // Inline code: pit-lane yellow on dark olive.
    code: '#ffd24a',
    codeBackground: '#2e2808',
  },
  kelantan: {
    // The rose red of Kelantan's songket and wau, so a heading differs from the gold accent.
    heading: '#ff8a9a',
    // Pale cream words in a red frame on dark brown, like the lit screen of a shadow play.
    quote: '#fde8c4',
    quoteBorder: '#c8402f',
    quoteBackground: '#2a1410',
    // Inline code: the jade green of the paddy fields on a dark green.
    code: '#7fe3b8',
    codeBackground: '#0e2a22',
  },
  // A light look, so every color is dark enough to read on a pale page.
  'kelantan-day': {
    // The deep jade of the paddy fields.
    heading: '#0b6a4c',
    // Dark brown words in a red frame on cream, like the lit cloth of the screen.
    quote: '#4a2a14',
    quoteBorder: '#c8402f',
    quoteBackground: '#fdf1dc',
    // Inline code: songket rose on a pale pink.
    code: '#8a2a3a',
    codeBackground: '#fbe0e4',
  },
}

// A fence of any indentation, so a fence inside a list item is still code.
const FENCE = /^\s*(`{3,}|~{3,})/
const QUOTE = /^ {0,3}>[ \t]?(.*)$/
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/
const CODE_SPAN = /`[^`]+`/
// What the hook does not draw itself, so the app keeps it: links, images, bare URLs, HTML, tables.
const APP_ONLY = /!?\[[^\]]*\]\(|https?:\/\/|<\/?[a-zA-Z][^>]*>|^\s*\|/

const closes = (line: string, fence: string): boolean => {
  const closing = line.trim()

  return closing.length >= fence.length && closing === fence.charAt(0).repeat(closing.length)
}

// Splits a chunk of plain markdown into the paragraphs and lists the hook draws itself (those
// with inline code, and nothing the app must keep) and the markdown left to the app.
function splitProse(chunk: string): Part[] {
  const blocks: { lines: string[]; app: boolean }[] = []
  let current: string[] = []
  let app = false
  let fence: string | undefined

  const end = (): void => {
    if (current.length > 0) {
      blocks.push({ lines: current, app })
    }
    current = []
    app = false
  }

  for (const line of chunk.split('\n')) {
    if (fence !== undefined) {
      current.push(line)
      if (closes(line, fence)) {
        fence = undefined
      }
      continue
    }
    const open = FENCE.exec(line)

    if (open !== null) {
      fence = open[1]
      app = true
      current.push(line)
      continue
    }
    if (line.trim() === '') {
      end()
      continue
    }
    current.push(line)
  }
  end()

  const parts: Part[] = []
  let kept: string[] = []

  const keep = (): void => {
    if (kept.length > 0) {
      parts.push({ kind: 'text', text: kept.join('\n\n') })
    }
    kept = []
  }

  for (const block of blocks) {
    const mine = !block.app && block.lines.some(line => CODE_SPAN.test(line)) && !block.lines.some(line => APP_ONLY.test(line) || RULE.test(line))

    if (mine) {
      keep()
      parts.push({ kind: 'prose', lines: block.lines })
    } else {
      kept.push(block.lines.join('\n'))
    }
  }
  keep()

  return parts
}

// Splits a reply into runs of plain markdown, drawn paragraphs and lists, headings and block
// quotes, in order. A fenced code block is never split: a `#` or `>` inside one is code.
export function splitChat(text: string): Part[] {
  const parts: Part[] = []
  let plain: string[] = []
  let quote: string[] = []
  let fence: string | undefined

  const flushPlain = (): void => {
    const joined = plain.join('\n').replace(/^\n+|\n+$/g, '')

    if (joined !== '') {
      parts.push(...splitProse(joined))
    }
    plain = []
  }
  const flushQuote = (): void => {
    if (quote.length > 0) {
      parts.push({ kind: 'quote', text: quote.join('\n').trim() })
      quote = []
    }
  }

  for (const line of text.split('\n')) {
    if (fence !== undefined) {
      plain.push(line)
      if (closes(line, fence)) {
        fence = undefined
      }
      continue
    }
    const open = FENCE.exec(line)

    if (open !== null) {
      flushQuote()
      fence = open[1]
      plain.push(line)
      continue
    }
    const quoted = QUOTE.exec(line)

    if (quoted !== null) {
      flushPlain()
      quote.push(quoted[1] ?? '')
      continue
    }
    flushQuote()
    const heading = HEADING.exec(line)

    if (heading !== null) {
      flushPlain()
      parts.push({ kind: 'heading', level: (heading[1] ?? '#').length, text: heading[2] ?? '' })
      continue
    }
    plain.push(line)
  }
  flushQuote()
  flushPlain()

  return parts
}

// True when the hook has something to draw. A reply with nothing to color is left to the app.
export const hasColoredParts = (parts: readonly Part[]): boolean => parts.some(part => part.kind !== 'text')

// ---------- inline text ----------

// A stretch of a line with one style: inline code, bold, italic or struck through.
export type Run = { text: string; code?: true; bold?: true; italic?: true; strike?: true }

// A code span: a run of back-quotes, then its text, then the same run again.
const CODE = /(`+)(?!`)([\s\S]*?[^`])\1(?!`)/g
const STYLE =
  /\*\*(.+?)\*\*|(?<![\w_])__(.+?)__(?![\w_])|~~(.+?)~~|(?<![\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])|(?<![\w_])_(?=\S)(.+?)(?<=\S)_(?![\w_])/

function styled(text: string, base: Omit<Run, 'text'>): Run[] {
  const found = STYLE.exec(text)

  if (found === null) {
    return text === '' ? [] : [{ ...base, text }]
  }
  const [whole, boldStar, boldUnder, strike, emStar, emUnder] = found
  const inner = boldStar ?? boldUnder ?? strike ?? emStar ?? emUnder ?? ''
  const style: Omit<Run, 'text'> =
    boldStar !== undefined || boldUnder !== undefined ? { ...base, bold: true } : strike !== undefined ? { ...base, strike: true } : { ...base, italic: true }

  return [...styled(text.slice(0, found.index), base), ...styled(inner, style), ...styled(text.slice(found.index + whole.length), base)]
}

// Splits one line of text into runs, so each can be drawn in its own style and color.
export function inlineRuns(text: string): Run[] {
  const runs: Run[] = []
  let last = 0

  for (const found of text.matchAll(CODE)) {
    const at = found.index ?? 0
    // A code span keeps its words as written, less one space at each end when it has both.
    const body = found[2] ?? ''

    runs.push(...styled(text.slice(last, at), {}))
    runs.push({ text: /^ .*[^ ].* $/.test(body) ? body.slice(1, -1) : body, code: true })
    last = at + found[0].length
  }
  runs.push(...styled(text.slice(last), {}))

  return runs
}

// A heading or a quote keeps its words but not its links: the link marks are dropped.
export const dropLinks = (text: string): string => text.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')

// A line of a list: its indent, its marker and its words.
export const LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/
