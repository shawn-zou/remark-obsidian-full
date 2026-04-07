import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'
import { footnote } from '../extensions/micromark/footnote'
import { embed } from '../extensions/micromark/embed'
import { blockReference } from '../extensions/micromark/block-ref'
import { tag } from '../extensions/micromark/tag'
import { callout } from '../extensions/micromark/callout'
import { highlight } from '../extensions/micromark/highlight'
import { comment } from '../extensions/micromark/comment'
import { math } from '../extensions/micromark/math'

describe('Full Extension Conflict Test', () => {
  it('should parse [[Note]] with wikiLink + footnote + embed + blockRef', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink(), footnote(), embed(), blockReference()]
    })
    expect(result).toBeDefined()
  })

  it('should parse [[Note]] with + tag', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink(), footnote(), embed(), blockReference(), tag()]
    })
    expect(result).toBeDefined()
  })

  it('should parse [[Note]] with + callout', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink(), footnote(), embed(), blockReference(), tag(), callout()]
    })
    expect(result).toBeDefined()
  })

  it('should parse [[Note]] with + highlight', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink(), footnote(), embed(), blockReference(), tag(), callout(), highlight()]
    })
    expect(result).toBeDefined()
  })

  it('should parse [[Note]] with + comment', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink(), footnote(), embed(), blockReference(), tag(), callout(), highlight(), comment()]
    })
    expect(result).toBeDefined()
  })

  it('should parse [[Note]] with + math (all extensions)', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink(), footnote(), embed(), blockReference(), tag(), callout(), highlight(), comment(), math()]
    })
    expect(result).toBeDefined()
  })
})
