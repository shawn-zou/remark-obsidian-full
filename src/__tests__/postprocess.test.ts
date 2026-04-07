import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { obsidian as obsidianMicromark } from '../extensions/micromark'

describe('Postprocess Test', () => {
  it('should parse [[Note]] with postprocess', () => {
    const parser = micromark.parse({
      extensions: obsidianMicromark()
    })
    
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    const postprocessed = micromark.postprocess(events)
    expect(postprocessed).toBeDefined()
  })
})
