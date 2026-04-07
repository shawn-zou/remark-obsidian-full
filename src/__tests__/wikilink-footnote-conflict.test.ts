import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'
import { footnote } from '../extensions/micromark/footnote'

function parseWithExtensions(extensions: micromark.Extension[]) {
  const parser = micromark.parse({ extensions })
  const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
  return micromark.postprocess(events)
}

describe('WikiLink vs Footnote Conflict Test', () => {
  it('should work with wikiLink only', () => {
    expect(() => parseWithExtensions([wikiLink()])).not.toThrow()
  })

  it('should work with footnote only', () => {
    expect(() => parseWithExtensions([footnote()])).not.toThrow()
  })

  it('should work with wikiLink + footnote', () => {
    expect(() => parseWithExtensions([wikiLink(), footnote()])).not.toThrow()
  })

  it('should work with footnote + wikiLink (different order)', () => {
    expect(() => parseWithExtensions([footnote(), wikiLink()])).not.toThrow()
  })
})
