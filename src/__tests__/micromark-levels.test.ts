import { describe, it, expect } from 'vitest'
import { parse, postprocess, preprocess } from 'micromark'
import { obsidian as obsidianMicromark } from '../extensions/micromark'

describe('Micromark Different Levels Test', () => {
  it('should parse [[Note]] with document level', () => {
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

  it('should parse [[Note]] with text level', () => {
    const options = {
      extensions: obsidianMicromark()
    }
    
    const result = postprocess(
      parse(options)
        .text()
        .write(preprocess()('[[Note]]', undefined, true))
    )
    expect(result).toBeDefined()
  })
})
