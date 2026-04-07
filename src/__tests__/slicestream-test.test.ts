import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('SliceStream Test', () => {
  it('should check sliceStream content', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    
    for (const event of events) {
      if (event[1].type === 'chunkFlow') {
        const context = event[2]
        const stream = context.sliceStream(event[1])
        console.log('Stream for chunkFlow:', stream)
        console.log('Stream length:', stream.length)
        for (let i = 0; i < stream.length; i++) {
          const chunk = stream[i]
          if (typeof chunk === 'string') {
            console.log(`  Chunk ${i}: string "${chunk}"`)
          } else {
            console.log(`  Chunk ${i}: code ${chunk}`)
          }
        }
      }
    }
    
    expect(events).toBeDefined()
  })
})
