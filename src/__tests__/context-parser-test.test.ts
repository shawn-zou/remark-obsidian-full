import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('Context Parser Test', () => {
  it('should check context parser', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    
    for (const event of events) {
      if (event[1].type === 'chunkFlow') {
        const context = event[2]
        console.log('Context parser:', {
          constructs: context.parser.constructs ? 'exists' : 'none',
          text: context.parser.text ? 'exists' : 'none'
        })
        
        if (context.parser.constructs) {
          console.log('Context constructs:', Object.keys(context.parser.constructs))
          if (context.parser.constructs.text) {
            console.log('Context text constructs:', Object.keys(context.parser.constructs.text))
            if (context.parser.constructs.text[91]) {
              console.log('Context text construct for [:', context.parser.constructs.text[91])
            }
          }
        }
      }
    }
    
    expect(events).toBeDefined()
  })
})
