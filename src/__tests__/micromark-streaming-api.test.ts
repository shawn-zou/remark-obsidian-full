import { describe, it, expect } from 'vitest'
import { parse, postprocess, preprocess } from 'micromark'
import { obsidian as obsidianMicromark } from '../extensions/micromark'

describe('Micromark Streaming API Test', () => {
  it('should parse [[Note]] with parse().document().write()', () => {
    const options = {
      extensions: obsidianMicromark()
    }
    
    const result = postprocess(
      parse(options)
        .document()
        .write(preprocess()('[[Note]]', undefined, true))
    )
    expect(result).toBeDefined()
  })
})
