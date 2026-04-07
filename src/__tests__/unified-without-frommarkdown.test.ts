import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { obsidian as obsidianMicromark } from '../extensions/micromark'

describe('Unified Processor Without FromMarkdown Test', () => {
  it('should parse [[Note]] without fromMarkdown extension', () => {
    const processor = unified()
      .use(remarkParse)
    
    const micromarkExtensions = obsidianMicromark()
    
    processor.data('micromarkExtensions', micromarkExtensions)
    
    const result = processor.parse('[[Note]]')
    expect(result).toBeDefined()
  })
})
