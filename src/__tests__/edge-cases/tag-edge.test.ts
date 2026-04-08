import { ObsidianParser } from '../../ObsidianParser'
import type { Tag } from '../../nodes'
import { describe, it, expect } from 'vitest'

describe('Tag Edge Cases', () => {
  const parser = new ObsidianParser()

  async function getFirstTag(text: string): Promise<Tag | undefined> {
    const ast = await parser.parse(text)
    const paragraph = ast.children[0]
    if (paragraph?.type === 'paragraph') {
      return (paragraph as any).children?.[0] as Tag
    }
    return undefined
  }

  describe('Basic Tag Parsing', () => {
    it('should parse simple tag', async () => {
      const tag = await getFirstTag('#tag')
      expect(tag?.type).toBe('tag')
      expect(tag?.value).toBe('tag')
    })

    it('should parse tag with numbers', async () => {
      const tag = await getFirstTag('#tag123')
      expect(tag?.value).toBe('tag123')
    })

    it('should parse tag starting with number', async () => {
      const tag = await getFirstTag('#123tag')
      expect(tag?.value).toBe('123tag')
    })

    it('should parse single character tag', async () => {
      const tag = await getFirstTag('#a')
      expect(tag?.value).toBe('a')
    })

    it('should parse single digit tag', async () => {
      const tag = await getFirstTag('#1')
      expect(tag?.value).toBe('1')
    })
  })

  describe('Nested Tags', () => {
    it('should parse nested tag', async () => {
      const tag = await getFirstTag('#parent/child')
      expect(tag?.value).toBe('parent/child')
      expect(tag?.nested).toEqual(['parent', 'child'])
    })

    it('should parse deeply nested tag', async () => {
      const tag = await getFirstTag('#a/b/c/d/e')
      expect(tag?.nested).toEqual(['a', 'b', 'c', 'd', 'e'])
    })

    it('should parse tag with multiple slashes', async () => {
      const tag = await getFirstTag('#tag//double')
      expect(tag?.nested).toEqual(['tag', '', 'double'])
    })

    it('should parse tag ending with slash', async () => {
      const tag = await getFirstTag('#tag/')
      expect(tag?.nested).toEqual(['tag', ''])
    })

    it('should parse tag starting with slash', async () => {
      const ast = await parser.parse('#/tag')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('tag')
    })
  })

  describe('Unicode and Special Characters', () => {
    it('should parse tag with unicode', async () => {
      const tag = await getFirstTag('#中文标签')
      expect(tag?.value).toBe('中文标签')
    })

    it('should parse tag with emoji', async () => {
      const tag = await getFirstTag('#📝笔记')
      expect(tag?.value).toBe('📝笔记')
    })

    it('should parse tag with japanese', async () => {
      const tag = await getFirstTag('#タグ')
      expect(tag?.value).toBe('タグ')
    })

    it('should parse tag with korean', async () => {
      const tag = await getFirstTag('#태그')
      expect(tag?.value).toBe('태그')
    })

    it('should parse tag with underscore', async () => {
      const tag = await getFirstTag('#tag_name')
      expect(tag?.value).toBe('tag_name')
    })

    it('should parse tag with hyphen', async () => {
      const tag = await getFirstTag('#tag-name')
      expect(tag?.value).toBe('tag-name')
    })

    it('should parse tag with dot', async () => {
      const tag = await getFirstTag('#tag.name')
      expect(tag?.value).toBe('tag.name')
    })
  })

  describe('Tag Boundaries', () => {
    it('should not include trailing punctuation', async () => {
      const tag = await getFirstTag('#tag.')
      expect(tag?.value).toBe('tag')
    })

    it('should not include trailing comma', async () => {
      const tag = await getFirstTag('#tag,')
      expect(tag?.value).toBe('tag')
    })

    it('should not include trailing exclamation', async () => {
      const tag = await getFirstTag('#tag!')
      expect(tag?.value).toBe('tag')
    })

    it('should not include trailing question mark', async () => {
      const tag = await getFirstTag('#tag?')
      expect(tag?.value).toBe('tag')
    })

    it('should not include trailing semicolon', async () => {
      const tag = await getFirstTag('#tag;')
      expect(tag?.value).toBe('tag')
    })

    it('should not include trailing colon', async () => {
      const tag = await getFirstTag('#tag:')
      expect(tag?.value).toBe('tag')
    })

    it('should include internal punctuation', async () => {
      const tag = await getFirstTag('#tag-name_test.value')
      expect(tag?.value).toBe('tag-name_test.value')
    })
  })

  describe('Tag in Context', () => {
    it('should parse tag at start of line', async () => {
      const tag = await getFirstTag('#tag text')
      expect(tag?.value).toBe('tag')
    })

    it('should parse tag in middle of text', async () => {
      const ast = await parser.parse('text #tag more')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[0]?.type).toBe('text')
      expect(children?.[1]?.type).toBe('tag')
      expect(children?.[2]?.type).toBe('text')
    })

    it('should parse tag at end of line', async () => {
      const ast = await parser.parse('text #tag')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[0]?.type).toBe('text')
      expect(children?.[1]?.type).toBe('tag')
    })

    it('should parse multiple tags', async () => {
      const ast = await parser.parse('#tag1 #tag2 #tag3')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[0]?.value).toBe('tag1')
      expect(children?.[2]?.value).toBe('tag2')
      expect(children?.[4]?.value).toBe('tag3')
    })

    it('should not parse tag after word char', async () => {
      const ast = await parser.parse('word#tag')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('text')
    })

    it('should parse tag after punctuation', async () => {
      const ast = await parser.parse('text.#tag')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[1]?.type).toBe('tag')
    })
  })

  describe('Tag with Markdown', () => {
    it('should not parse tag inside bold markers', async () => {
      const ast = await parser.parse('**#tag**')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('text')
    })

    it('should not parse tag inside italic markers', async () => {
      const ast = await parser.parse('*#tag*')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('text')
    })

    it('should not parse heading as tag', async () => {
      const ast = await parser.parse('# Heading')
      const heading = ast.children[0]
      expect(heading?.type).toBe('heading')
    })

    it('should parse tag after heading', async () => {
      const ast = await parser.parse('# Heading #tag')
      const heading = ast.children[0]
      expect(heading?.type).toBe('heading')
      const tag = (heading as any).children?.[1]
      expect(tag?.type).toBe('tag')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty tag', async () => {
      const ast = await parser.parse('#')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('tag')
    })

    it('should handle very long tag', async () => {
      const longTag = 'a'.repeat(200)
      const tag = await getFirstTag(`#${longTag}`)
      expect(tag?.value).toBe(longTag)
    })

    it('should handle tag with only numbers', async () => {
      const tag = await getFirstTag('#123456')
      expect(tag?.value).toBe('123456')
    })

    it('should handle tag with mixed case', async () => {
      const tag = await getFirstTag('#TagName')
      expect(tag?.value).toBe('TagName')
    })

    it('should handle consecutive tags', async () => {
      const ast = await parser.parse('#tag1#tag2')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[0]?.type).toBe('tag')
      expect(children?.[1]?.type).toBe('tag')
    })
  })

  describe('Round-trip', () => {
    const testCases = [
      '#tag',
      '#tag123',
      '#中文',
      '#tag/subtag',
      '#a/b/c',
      '#tag_name',
      '#tag-name',
    ]

    testCases.forEach(input => {
      it(`should round-trip: ${input}`, async () => {
        const ast = await parser.parse(input)
        const output = await parser.stringify(ast)
        expect(output.trim()).toBe(input)
      })
    })
  })
})
