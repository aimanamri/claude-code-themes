import type { LookSpec } from './types'

import { kelantan } from './kelantan'
import { kelantanDay } from './kelantan-day'
import { penang } from './penang'
import { petronasKl } from './petronas-kl'
import { sabah } from './sabah'
import { sepang } from './sepang'
import { terengganu } from './terengganu'

// The app redraws a backdrop only when the name of its scene changes. So each scene is renamed to
// end in a tag made from its drawing, such as `penang-1x2y3z`. Without it, a look whose drawing was
// edited would keep showing its old picture after a reload.
function tagOf(source: string): string {
  let sum = 5381

  for (const ch of source) {
    sum = (Math.imul(sum, 33) ^ (ch.codePointAt(0) ?? 0)) >>> 0
  }

  return sum.toString(36)
}

function withTaggedScenes(look: LookSpec): LookSpec {
  const tagged: Record<string, string> = {}
  const scenes: LookSpec['scenes'] = {}

  for (const [name, scene] of Object.entries(look.scenes)) {
    const renamed = `${name}-${tagOf(scene.source)}`

    tagged[name] = renamed
    scenes[renamed] = scene
  }
  const { backdrop } = look.theme
  const current = backdrop !== undefined && 'scene' in backdrop && typeof backdrop.scene === 'string' ? tagged[backdrop.scene] : undefined

  return {
    ...look,
    scenes,
    theme: backdrop === undefined || current === undefined ? look.theme : { ...look.theme, backdrop: { ...backdrop, scene: current } as typeof backdrop },
  }
}

// Every look `/look` can switch to, in the order it lists them and `next` goes through them.
// To add one: write hooks/looks/<id>.ts that exports a LookSpec, and list it here.
export const LOOKS: readonly LookSpec[] = [petronasKl, penang, terengganu, sepang, kelantan, kelantanDay, sabah].map(withTaggedScenes)

// The look used until one has been picked.
export const FIRST_LOOK = LOOKS[0]?.id ?? 'off'
