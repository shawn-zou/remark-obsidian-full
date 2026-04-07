import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { obsidian as obsidianMicromark } from '../extensions/micromark'

describe('Micromark Parse vs Micromark Test', () => {
  it('should parse [[Note]] with micromark.parse', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: obsidianMicromark()
    })
    expect(result).toBeDefined()
  })

  it('should parse [[Note]] with micromark (streaming)', () => {
    const result = micromark.micromark('[[Note]]', {
      extensions: obsidianMicromark()
    })
    expect(result).toBeDefined()
  })
})
