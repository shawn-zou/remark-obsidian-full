import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('Tokenizer Events Test', () => {
  it('should check tokenizer events', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    
    for (const event of events) {
      if (event[1].type === 'chunkFlow') {
        const tokenizer = (event[1] as any)._tokenizer
        console.log('Tokenizer events:', tokenizer.events.length)
        for (const te of tokenizer.events) {
          console.log('  Tokenizer event:', te[0], te[1].type)
        }
      }
    }
    
    expect(events).toBeDefined()
  })
})
