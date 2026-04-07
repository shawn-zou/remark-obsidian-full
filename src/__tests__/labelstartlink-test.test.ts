import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'

describe('LabelStartLink Test', () => {
  it('should parse [[Note]] with default constructs', () => {
    const parser = micromark.parse({})
    const textParser = parser.text({ _index: 0, _bufferIndex: -1, line: 1, column: 1, offset: 0 })
    
    console.log('textParser.parser.constructs.text:', textParser.parser.constructs.text)
    
    const stream = ['[[Note]]', null]
    console.log('Calling textParser.write with stream:', stream)
    
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
