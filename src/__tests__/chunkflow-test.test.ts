import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('ChunkFlow Test', () => {
  it('should understand chunkFlow structure', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    
    console.log('Events:', events.length)
    for (const event of events) {
      console.log('Event:', event[0], event[1].type)
      if (event[1].type === 'chunkFlow') {
        console.log('  chunkFlow token:', {
          start: event[1].start,
          end: event[1].end,
          contentType: (event[1] as any).contentType,
          _tokenizer: (event[1] as any)._tokenizer ? 'exists' : 'none',
          previous: (event[1] as any).previous ? 'exists' : 'none',
          next: (event[1] as any).next ? 'exists' : 'none'
        })
      }
    }
    
    expect(events).toBeDefined()
  })
})
