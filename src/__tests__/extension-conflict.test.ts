import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'
import { footnote } from '../extensions/micromark/footnote'
import { embed } from '../extensions/micromark/embed'
import { blockReference } from '../extensions/micromark/block-ref'

describe('Extension Conflict Test', () => {
  it('should parse [[Note]] with wikiLink only', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink()]
    })
    expect(result).toBeDefined()
  })

  it('should parse [[Note]] with wikiLink + footnote', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink(), footnote()]
    })
    expect(result).toBeDefined()
  })

  it('should parse [[Note]] with wikiLink + footnote + embed', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink(), footnote(), embed()]
    })
    expect(result).toBeDefined()
  })

  it('should parse [[Note]] with wikiLink + footnote + embed + blockRef', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink(), footnote(), embed(), blockReference()]
    })
    expect(result).toBeDefined()
  })
})
