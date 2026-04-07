import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { obsidian as obsidianMicromark } from '../extensions/micromark'

describe('Debug Events Test', () => {
  it('should debug events', () => {
    const parser = micromark.parse({
      extensions: obsidianMicromark()
    })
    
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    
    console.log('Events count:', events.length)
    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      console.log(`Event ${i}:`, event[0], event[1].type, event[1].contentType || '')
    }
    
    expect(events).toBeDefined()
  })
})
