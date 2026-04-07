import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('ChunkText Test', () => {
  it('should check chunkText structure', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    
    for (const event of events) {
      if (event[1].type === 'chunkFlow') {
        const tokenizer = (event[1] as any)._tokenizer
        for (const te of tokenizer.events) {
          if (te[1].type === 'chunkText') {
            console.log('chunkText token:', {
              type: te[1].type,
              contentType: (te[1] as any).contentType,
              _tokenizer: (te[1] as any)._tokenizer ? 'exists' : 'none',
              previous: (te[1] as any).previous ? 'exists' : 'none',
              next: (te[1] as any).next ? 'exists' : 'none'
            })
          }
        }
      }
    }
    
    expect(events).toBeDefined()
  })
})
