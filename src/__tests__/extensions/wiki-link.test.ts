import { describe, it, expect } from 'vitest'
import { ObsidianParser } from '../../ObsidianParser'
import type { WikiLink } from '../../nodes'

describe('WikiLink Extension', () => {
  const parser = new ObsidianParser()

  describe('parse', () => {
    it('should parse basic wiki link', async () => {
      const ast = await parser.parse('[[Note Name]]')
      const paragraph = ast.children[0]
      expect(paragraph?.type).toBe('paragraph')
      const link = (paragraph as any)?.children?.[0] as WikiLink
      expect(link?.type).toBe('wikiLink')
      expect(link?.value).toBe('Note Name')
    })

    it('should parse wiki link with alias', async () => {
      const ast = await parser.parse('[[Note|Display]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('Note')
      expect(link?.alias).toBe('Display')
    })

    it('should parse wiki link with heading', async () => {
      const ast = await parser.parse('[[Note#Section]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('Note')
      expect(link?.heading).toBe('Section')
    })

    it('should parse wiki link with block id', async () => {
      const ast = await parser.parse('[[Note#^block123]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('Note')
      expect(link?.blockId).toBe('block123')
    })

    it('should parse wiki link with heading and alias', async () => {
      const ast = await parser.parse('[[Note#Section|Display]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('Note')
      expect(link?.heading).toBe('Section')
      expect(link?.alias).toBe('Display')
    })

    it('should parse wiki link with block id and alias', async () => {
      const ast = await parser.parse('[[Note#^block123|Display]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('Note')
      expect(link?.blockId).toBe('block123')
      expect(link?.alias).toBe('Display')
    })

    it('should handle escaped pipe in filename', async () => {
      const ast = await parser.parse('[[file\\|name]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('file|name')
    })

    it('should handle escaped hash in filename', async () => {
      const ast = await parser.parse('[[file\\#name]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('file#name')
    })
  })

  describe('stringify', () => {
    it('should stringify basic wiki link', async () => {
      const ast = await parser.parse('[[Note]]')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('[[Note]]')
    })

    it('should preserve alias', async () => {
      const ast = await parser.parse('[[Note|Display]]')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('[[Note|Display]]')
    })

    it('should preserve heading', async () => {
      const ast = await parser.parse('[[Note#Section]]')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('[[Note#Section]]')
    })

    it('should preserve block id', async () => {
      const ast = await parser.parse('[[Note#^block123]]')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('[[Note#^block123]]')
    })
  })

  describe('round-trip', () => {
    const testCases = [
      '[[Note]]',
      '[[Note|Display]]',
      '[[Note#Section]]',
      '[[Note#^block123]]',
      '[[Note#Section|Display]]',
      '[[Note#^block123|Display]]'
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

async function getFirstWikiLink(ast: any): Promise<WikiLink | undefined> {
  const paragraph = ast.children[0]
  if (paragraph?.type === 'paragraph') {
    return paragraph.children?.[0] as WikiLink
  }
  return undefined
}
