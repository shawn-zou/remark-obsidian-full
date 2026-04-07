import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('Correct Micromark API Test', () => {
  it('should parse [[Note]] with correct API', () => {
    const parser = micromark.parse({
      extensions: [wikiLink()]
    })
    
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    expect(events).toBeDefined()
    expect(events.length).toBeGreaterThan(0)
  })
})
