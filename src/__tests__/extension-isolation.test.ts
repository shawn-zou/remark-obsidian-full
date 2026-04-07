import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'
import { embed } from '../extensions/micromark/embed'
import { tag } from '../extensions/micromark/tag'
import { callout } from '../extensions/micromark/callout'
import { highlight } from '../extensions/micromark/highlight'
import { comment } from '../extensions/micromark/comment'
import { footnote } from '../extensions/micromark/footnote'
import { blockReference } from '../extensions/micromark/block-ref'
import { math } from '../extensions/micromark/math'

function parseWithExtensions(extensions: micromark.Extension[]) {
  const parser = micromark.parse({ extensions })
  const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
  return micromark.postprocess(events)
}

describe('Extension Isolation Test', () => {
  it('should work with wikiLink only', () => {
    expect(() => parseWithExtensions([wikiLink()])).not.toThrow()
  })

  it('should work with wikiLink + embed', () => {
    expect(() => parseWithExtensions([wikiLink(), embed()])).not.toThrow()
  })

  it('should work with wikiLink + embed + tag', () => {
    expect(() => parseWithExtensions([wikiLink(), embed(), tag()])).not.toThrow()
  })

  it('should work with wikiLink + embed + tag + callout', () => {
    expect(() => parseWithExtensions([wikiLink(), embed(), tag(), callout()])).not.toThrow()
  })

  it('should work with wikiLink + embed + tag + callout + highlight', () => {
    expect(() => parseWithExtensions([wikiLink(), embed(), tag(), callout(), highlight()])).not.toThrow()
  })

  it('should work with wikiLink + embed + tag + callout + highlight + comment', () => {
    expect(() => parseWithExtensions([wikiLink(), embed(), tag(), callout(), highlight(), comment()])).not.toThrow()
  })

  it('should work with wikiLink + embed + tag + callout + highlight + comment + footnote', () => {
    expect(() => parseWithExtensions([wikiLink(), embed(), tag(), callout(), highlight(), comment(), footnote()])).not.toThrow()
  })

  it('should work with wikiLink + embed + tag + callout + highlight + comment + footnote + blockRef', () => {
    expect(() => parseWithExtensions([wikiLink(), embed(), tag(), callout(), highlight(), comment(), footnote(), blockReference()])).not.toThrow()
  })

  it('should work with all extensions', () => {
    expect(() => parseWithExtensions([wikiLink(), embed(), tag(), callout(), highlight(), comment(), footnote(), blockReference(), math()])).not.toThrow()
  })
})
