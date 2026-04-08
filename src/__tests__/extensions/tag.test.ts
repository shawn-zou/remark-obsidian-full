import { ObsidianParser } from '../ObsidianParser'
import type { Tag } from '../nodes'

describe('Tag Extension', () => {
  const parser = new ObsidianParser()

  describe('parse', () => {
    it('should parse basic tag', async () => {
      const ast = await parser.parse('#tag')
      const paragraph = ast.children[0]
      expect(paragraph?.type).toBe('paragraph')
      const tag = (paragraph as any)?.children?.[0] as Tag
      expect(tag?.type).toBe('tag')
      expect(tag?.value).toBe('tag')
    })

    it('should parse nested tag', async () => {
      const ast = await parser.parse('#nested/tag')
      const tag = await getFirstTag(ast)
      expect(tag?.value).toBe('nested/tag')
      expect(tag?.nested).toEqual(['nested', 'tag'])
    })

    it('should parse tag with hyphen', async () => {
      const ast = await parser.parse('#my-tag')
      const tag = await getFirstTag(ast)
      expect(tag?.value).toBe('my-tag')
    })

    it('should parse tag with underscore', async () => {
      const ast = await parser.parse('#my_tag')
      const tag = await getFirstTag(ast)
      expect(tag?.value).toBe('my_tag')
    })

    it('should parse tag with unicode', async () => {
      const ast = await parser.parse('#标签')
      const tag = await getFirstTag(ast)
      expect(tag?.value).toBe('标签')
    })

    it('should parse deeply nested tag', async () => {
      const ast = await parser.parse('#a/b/c/d')
      const tag = await getFirstTag(ast)
      expect(tag?.value).toBe('a/b/c/d')
      expect(tag?.nested).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  describe('stringify', () => {
    it('should stringify basic tag', async () => {
      const ast = await parser.parse('#tag')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('#tag')
    })

    it('should preserve nested structure', async () => {
      const ast = await parser.parse('#nested/tag')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('#nested/tag')
    })
  })

  describe('round-trip', () => {
    const testCases = [
      '#tag',
      '#nested/tag',
      '#my-tag',
      '#my_tag',
      '#a/b/c/d'
    ]

    testCases.forEach(input => {
      it(`should round-trip: ${input}`, async () => {
        const ast = await parser.parse(input)
        const output = await parser.stringify(ast)
        expect(output.trim()).toBe(input)
      })
    })
  })

  describe('invalid syntax', () => {
    it('should reject empty tag', async () => {
      const ast = await parser.parse('#')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('text')
    })

    it('should reject tag after word character', async () => {
      const ast = await parser.parse('word#tag')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('text')
    })

    it('should reject tag starting with slash', async () => {
      const ast = await parser.parse('#/tag')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('tag')
    })

    it('should not parse heading as tag', async () => {
      const ast = await parser.parse('# Heading')
      const heading = ast.children[0]
      expect(heading?.type).toBe('heading')
    })

    it('should not include trailing punctuation in tag', async () => {
      const ast = await parser.parse('#tag.')
      const paragraph = ast.children[0]
      const tag = (paragraph as any).children?.[0]
      expect(tag?.value).toBe('tag')
    })

    it('should not include trailing comma in tag', async () => {
      const ast = await parser.parse('#tag,')
      const paragraph = ast.children[0]
      const tag = (paragraph as any).children?.[0]
      expect(tag?.value).toBe('tag')
    })

    it('should not include trailing exclamation in tag', async () => {
      const ast = await parser.parse('#tag!')
      const paragraph = ast.children[0]
      const tag = (paragraph as any).children?.[0]
      expect(tag?.value).toBe('tag')
    })

    it('should not include trailing question mark in tag', async () => {
      const ast = await parser.parse('#tag?')
      const paragraph = ast.children[0]
      const tag = (paragraph as any).children?.[0]
      expect(tag?.value).toBe('tag')
    })
  })
})

async function getFirstTag(ast: any): Promise<Tag | undefined> {
  const paragraph = ast.children[0]
  if (paragraph?.type === 'paragraph') {
    return paragraph.children?.[0] as Tag
  }
  return undefined
}
