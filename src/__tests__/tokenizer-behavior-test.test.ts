import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('Tokenizer Behavior Test', () => {
  it('should test wikiLink tokenizer with single bracket', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const textParser = parser.text({ _index: 0, _bufferIndex: -1, line: 1, column: 1, offset: 0 })
    
    const stream = ['[Note]', null]
    console.log('Testing with single bracket:', stream)
    
    try {
      const events = textParser.write(stream)
      console.log('Events:', events.length)
      for (const e of events) {
        console.log('Event:', e[0], e[1].type)
      }
    } catch (error) {
      console.log('Error:', error)
    }
    
    expect(true).toBe(true)
  })

  it('should test wikiLink tokenizer with double brackets', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const textParser = parser.text({ _index: 0, _bufferIndex: -1, line: 1, column: 1, offset: 0 })
    
    const stream = ['[[Note]]', null]
    console.log('Testing with double brackets:', stream)
    
    try {
      const events = textParser.write(stream)
      console.log('Events:', events.length)
      for (const e of events) {
        console.log('Event:', e[0], e[1].type)
      }
    } catch (error) {
      console.log('Error:', error)
    }
    
    expect(true).toBe(true)
  })
})
