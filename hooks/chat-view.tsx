import type { EngineInterface } from 'claude-code'

import { type ChatColors, LIST_ITEM, dropLinks, hasColoredParts, inlineRuns, splitChat } from './chat-colors'

// Drawing a chat message in the colors of a look. Used by the hooks in register.tsx.

export type DrawEvent = Parameters<EngineInterface['ui']['resolve']>[0]

// Draws a message in the look's chat colors: headings, quotes and paragraphs or lists with inline
// code in their own colors, the rest through the app's own markdown renderer. Returns nothing when
// the text has nothing to color, so the caller leaves the message to the app.
export function chatTree($: EngineInterface, e: DrawEvent, text: string, colors: ChatColors) {
  const parts = splitChat(text)

  if (!hasColoredParts(parts)) {
    return undefined
  }
  const { Box, Text, Markdown } = $.ui.resolve(e)

  // One line of text: each run in its own style, inline code in gold on a dark gold. Every run
  // names its color, so none depends on what a nested Text inherits.
  const inline = (text: string, color: string, style: { bold?: boolean; italic?: boolean } = {}) => (
    <Text color={color} {...style}>
      {inlineRuns(text).map(run => (
        <Text
          color={run.code === true ? colors.code : color}
          backgroundColor={run.code === true ? colors.codeBackground : undefined}
          mono={run.code === true ? true : undefined}
          bold={run.bold === true || style.bold === true ? true : undefined}
          italic={run.italic === true || style.italic === true ? true : undefined}
          strikethrough={run.strike === true ? true : undefined}
        >
          {run.text}
        </Text>
      ))}
    </Text>
  )

  return (
    <Box flexDirection="column" gap={1}>
      {parts.map(part => {
        if (part.kind === 'text') {
          return <Markdown text={part.text} />
        }
        if (part.kind === 'heading') {
          return (
            <Text color={colors.heading} bold size={part.level === 1 ? 'title' : part.level === 2 ? 'heading' : 'body'}>
              {dropLinks(part.text)}
            </Text>
          )
        }
        if (part.kind === 'quote') {
          return (
            <Box borderStyle="round" borderColor={colors.quoteBorder} backgroundColor={colors.quoteBackground} paddingX={1}>
              {inline(dropLinks(part.text), colors.quote, { italic: true })}
            </Box>
          )
        }

        // A paragraph or a list with inline code: each list item is a marker beside its words.
        return (
          <Box flexDirection="column">
            {part.lines.map(line => {
              const item = LIST_ITEM.exec(line)

              if (item === null) {
                return inline(line.trim(), 'text')
              }
              const marker = /^\d/.test(item[2] ?? '') ? (item[2] ?? '') : '•'

              return (
                <Box flexDirection="row" gap={1} paddingLeft={Math.floor((item[1] ?? '').length / 2)}>
                  <Text color={colors.heading}>{marker}</Text>
                  <Box flexShrink={1}>{inline(item[3] ?? '', 'text')}</Box>
                </Box>
              )
            })}
          </Box>
        )
      })}
    </Box>
  )
}
