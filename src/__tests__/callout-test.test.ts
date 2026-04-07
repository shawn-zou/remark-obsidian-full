import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'
import { callout } from '../extensions/micromark/callout'

function parseWithExtensions(extensions: micromark.Extension[]) {
  const parser = micromark.parse({ extensions })
  const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
  return micromark.postprocess(events)
}

describe('Callout Test', () => {
  it('should work without callout', () => {
    expect(() => parseWithExtensions([wikiLink()])).not.toThrow()
  })

  it('should work with callout only', () => {
    expect(() => parseWithExtensions([callout()])).not.toThrow()
  })

  it('should work with wikiLink + callout', () => {
    expect(() => parseWithExtensions([wikiLink(), callout()])).not.toThrow()
  })
})
