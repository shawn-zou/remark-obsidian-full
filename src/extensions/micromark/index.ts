export { wikiLink, parseWikiLinkValue, type WikiLinkOptions } from './wiki-link'
export { embed, parseEmbedValue, type EmbedOptions } from './embed'
export { tag, parseTagValue, isValidTag, type TagOptions } from './tag'
export { callout, parseCalloutType, type CalloutOptions } from './callout'
export { highlight } from './highlight'
export { comment } from './comment'
export { footnote } from './footnote'
export { blockReference } from './block-ref'
export { math, type MathOptions } from './math'

import { wikiLink } from './wiki-link'
import { embed } from './embed'
import { tag } from './tag'
import { callout } from './callout'
import { highlight } from './highlight'
import { comment } from './comment'
import { footnote } from './footnote'
import { blockReference } from './block-ref'
import { math } from './math'
import type { Extension } from 'micromark-util-types'

export function obsidian(): Extension[] {
  return [
    wikiLink(),
    embed(),
    tag(),
    callout(),
    highlight(),
    comment(),
    footnote(),
    blockReference(),
    // math() // 暂时禁用，有bug
  ]
}
