import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('Tokenizer Debug Test', () => {
  it('should debug tokenizer behavior', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    
    for (const event of events) {
      if (event[1].type === 'chunkFlow') {
        const token = event[1] as any
        const tokenizer = token._tokenizer
        
        console.log('Tokenizer exists:', !!tokenizer)
        console.log('Tokenizer events count:', tokenizer.events.length)
        
        for (const te of tokenizer.events) {
          console.log('Tokenizer event:', te[0], te[1].type)
          if (te[1].type === 'chunkText') {
            const chunkTextToken = te[1] as any
            console.log('  chunkText contentType:', chunkTextToken.contentType)
            console.log('  chunkText _tokenizer:', !!chunkTextToken._tokenizer)
          }
        }
        
        const context = event[2]
        const stream = context.sliceStream(token)
        console.log('Stream:', stream)
        
        const textParser = context.parser.text(token.start)
        console.log('textParser:', textParser)
        console.log('textParser constructs:', textParser.constructs)
        
        stream.push(null)
        const textEvents = textParser.write(stream)
        console.log('textEvents count:', textEvents.length)
        for (const te of textEvents) {
          console.log('textEvent:', te[0], te[1].type)
        }
      }
    }
    
    expect(events).toBeDefined()
  })
})
