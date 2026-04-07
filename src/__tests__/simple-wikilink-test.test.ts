import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('Simple WikiLink Test', () => {
  it('should parse [[Note]] without postprocess', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    console.log('Events without postprocess:', events.length)
    for (const event of events) {
      console.log('Event:', event[0], event[1].type)
    }
    expect(events).toBeDefined()
    expect(events.length).toBeGreaterThan(0)
  })

  it('should parse [[Note]] with postprocess', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    console.log('Events before postprocess:', events.length)
    const postprocessed = micromark.postprocess(events)
    console.log('Events after postprocess:', postprocessed.length)
    expect(postprocessed).toBeDefined()
  })
})
