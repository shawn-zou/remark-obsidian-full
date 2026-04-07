import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { obsidian as obsidianMicromark } from '../extensions/micromark'
import { obsidianFromMarkdown } from '../extensions/mdast'

describe('Unified Processor Test', () => {
  it('should parse [[Note]] with unified + remark-parse', () => {
    const processor = unified()
      .use(remarkParse)
    
    const micromarkExtensions = obsidianMicromark()
    const fromMarkdownExtensions = [obsidianFromMarkdown()]
    
    processor.data('micromarkExtensions', micromarkExtensions)
    processor.data('fromMarkdownExtensions', fromMarkdownExtensions)
    
    const result = processor.parse('[[Note]]')
    expect(result).toBeDefined()
  })
})
