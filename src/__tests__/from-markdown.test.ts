import { describe, it, expect } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { obsidian as obsidianMicromark } from '../extensions/micromark'
import { obsidianFromMarkdown } from '../extensions/mdast'

describe('FromMarkdown Test', () => {
  it('should parse [[Note]] with fromMarkdown', () => {
    const result = fromMarkdown('[[Note]]', {
      extensions: obsidianMicromark(),
      mdastExtensions: [obsidianFromMarkdown()]
    })
    expect(result).toBeDefined()
  })
})
