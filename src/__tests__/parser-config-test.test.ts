import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('Parser Config Test', () => {
  it('should check parser configuration', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    
    console.log('Parser:', {
      constructs: parser.constructs ? 'exists' : 'none',
      text: parser.text ? 'exists' : 'none'
    })
    
    if (parser.constructs) {
      console.log('Constructs:', Object.keys(parser.constructs))
      if (parser.constructs.text) {
        console.log('Text constructs:', Object.keys(parser.constructs.text))
        if (parser.constructs.text[91]) {
          console.log('Text construct for [:', parser.constructs.text[91])
        }
      }
    }
    
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    expect(events).toBeDefined()
  })
})
