import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { obsidian as obsidianMicromark } from '../extensions/micromark'

describe('All Extensions Test', () => {
  it('should parse [[Note]] with all extensions', () => {
    const parser = micromark.parse({
      extensions: obsidianMicromark()
    })
    
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    expect(events).toBeDefined()
    expect(events.length).toBeGreaterThan(0)
  })
})
