import type { ThemeSetArgs } from 'claude-code'

// A scene: the SVG that is drawn, and a line that describes it for people who cannot see it.
export type Scene = { source: string; alt: string }

// One look: the theme the app is given, and the moving scenes its backdrop can name.
export type LookSpec = {
  // What `/look <id>` takes: lowercase letters, digits and hyphens.
  id: string
  label: string
  // One line for the `/look` list.
  description: string
  theme: ThemeSetArgs
  // The scenes the theme's backdrop can name, by scene name. Each is an SVG under 131,072 characters.
  scenes: Record<string, Scene>
  // What `makeColors` found wrong with the colors. A line that starts "Desktop won't paint" is fatal.
  problems?: string[]
}
