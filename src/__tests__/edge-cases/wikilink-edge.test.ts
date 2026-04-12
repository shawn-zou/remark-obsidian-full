import { ObsidianParser } from '../../ObsidianParser'
import type { WikiLink } from '../../nodes'
import { describe, it, expect } from 'vitest'

describe('WikiLink Edge Cases', () => {
  const parser = new ObsidianParser()

  async function getFirstWikiLink(text: string): Promise<WikiLink | undefined> {
    const ast = await parser.parse(text)
    const paragraph = ast.children[0]
    if (paragraph?.type === 'paragraph') {
      return (paragraph as any).children?.[0] as WikiLink
    }
    return undefined
  }

  describe('Empty and Minimal Cases', () => {
    it('should handle empty wiki link as invalid', async () => {
      const ast = await parser.parse('[[]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('wikiLink')
    })

    it('should handle single character', async () => {
      const link = await getFirstWikiLink('[[a]]')
      expect(link?.value).toBe('a')
    })

    it('should handle single digit', async () => {
      const link = await getFirstWikiLink('[[1]]')
      expect(link?.value).toBe('1')
    })

    it('should handle unicode characters', async () => {
      const link = await getFirstWikiLink('[[中文笔记]]')
      expect(link?.value).toBe('中文笔记')
    })

    it('should handle emoji', async () => {
      const link = await getFirstWikiLink('[[📝笔记]]')
      expect(link?.value).toBe('📝笔记')
    })
  })

  describe('Special Characters in Content', () => {
    it('should handle escaped pipe in value', async () => {
      const link = await getFirstWikiLink('[[file\\|name]]')
      expect(link?.value).toBe('file|name')
    })

    it('should handle escaped hash in value', async () => {
      const link = await getFirstWikiLink('[[file\\#name]]')
      expect(link?.value).toBe('file#name')
    })

    it('should handle escaped caret in value', async () => {
      const link = await getFirstWikiLink('[[file\\^name]]')
      expect(link?.value).toBe('file^name')
    })

    it('should handle multiple escaped characters', async () => {
      const link = await getFirstWikiLink('[[a\\|b\\#c\\^d]]')
      expect(link?.value).toBe('a|b#c^d')
    })

    it('should handle spaces in value', async () => {
      const link = await getFirstWikiLink('[[note with spaces]]')
      expect(link?.value).toBe('note with spaces')
    })

    it('should handle tabs in value', async () => {
      const link = await getFirstWikiLink('[[note\twith\ttabs]]')
      expect(link?.value).toBe('note\twith\ttabs')
    })

    it('should handle special markdown chars', async () => {
      const link = await getFirstWikiLink('[[note*bold*_italic_]]')
      expect(link?.value).toBe('note*bold*_italic_')
    })

    it('should handle brackets in value', async () => {
      const link = await getFirstWikiLink('[[note (with parens)]]')
      expect(link?.value).toBe('note (with parens)')
    })

    it('should handle angle brackets', async () => {
      const link = await getFirstWikiLink('[[note <angle>]]')
      expect(link?.value).toBe('note <angle>')
    })
  })

  describe('Heading Edge Cases', () => {
    it('should handle empty heading as invalid', async () => {
      const ast = await parser.parse('[[note#]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('wikiLink')
    })

    it('should handle heading with spaces', async () => {
      const link = await getFirstWikiLink('[[note#heading with spaces]]')
      expect(link?.heading).toBe('heading with spaces')
    })

    it('should handle heading with special chars', async () => {
      const link = await getFirstWikiLink('[[note#heading-with_special.chars]]')
      expect(link?.heading).toBe('heading-with_special.chars')
    })

    it('should handle escaped pipe in heading', async () => {
      const link = await getFirstWikiLink('[[note#head\\|ing]]')
      expect(link?.heading).toBe('head|ing')
    })

    it('should handle multiple hashes in heading', async () => {
      const link = await getFirstWikiLink('[[note#heading##sub]]')
      expect(link?.heading).toBe('sub')
    })
  })

  describe('Block ID Edge Cases', () => {
    it('should handle empty block id as invalid', async () => {
      const ast = await parser.parse('[[note#^]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('wikiLink')
    })

    it('should handle block id with numbers', async () => {
      const link = await getFirstWikiLink('[[note#^12345]]')
      expect(link?.blockId).toBe('12345')
    })

    it('should handle block id with letters and numbers', async () => {
      const link = await getFirstWikiLink('[[note#^abc123def]]')
      expect(link?.blockId).toBe('abc123def')
    })

    it('should handle block id with hyphens', async () => {
      const link = await getFirstWikiLink('[[note#^block-id-123]]')
      expect(link?.blockId).toBe('block-id-123')
    })

    it('should handle single char block id', async () => {
      const link = await getFirstWikiLink('[[note#^a]]')
      expect(link?.blockId).toBe('a')
    })
  })

  describe('Alias Edge Cases', () => {
    it('should handle empty alias as invalid', async () => {
      const ast = await parser.parse('[[note|]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('wikiLink')
    })

    it('should handle alias with spaces', async () => {
      const link = await getFirstWikiLink('[[note|alias with spaces]]')
      expect(link?.alias).toBe('alias with spaces')
    })

    it('should handle alias with special chars', async () => {
      const link = await getFirstWikiLink('[[note|alias*bold*_italic_]]')
      expect(link?.alias).toBe('alias*bold*_italic_')
    })

    it('should handle alias with unicode', async () => {
      const link = await getFirstWikiLink('[[note|中文别名]]')
      expect(link?.alias).toBe('中文别名')
    })

    it('should handle escaped hash in alias', async () => {
      const link = await getFirstWikiLink('[[note|alias\\#hash]]')
      expect(link?.alias).toBe('alias#hash')
    })
  })

  describe('Complex Combinations', () => {
    it('should handle heading + alias', async () => {
      const link = await getFirstWikiLink('[[note#section|display]]')
      expect(link?.value).toBe('note')
      expect(link?.heading).toBe('section')
      expect(link?.alias).toBe('display')
    })

    it('should handle block id + alias', async () => {
      const link = await getFirstWikiLink('[[note#^block|display]]')
      expect(link?.value).toBe('note')
      expect(link?.blockId).toBe('block')
      expect(link?.alias).toBe('display')
    })

    it('should handle escaped chars with heading and alias', async () => {
      const link = await getFirstWikiLink('[[file\\|name#section|display]]')
      expect(link?.value).toBe('file|name')
      expect(link?.heading).toBe('section')
      expect(link?.alias).toBe('display')
    })

    it('should handle very long value', async () => {
      const longValue = 'a'.repeat(1000)
      const link = await getFirstWikiLink(`[[${longValue}]]`)
      expect(link?.value).toBe(longValue)
    })

    it('should handle very long alias', async () => {
      const longAlias = 'b'.repeat(1000)
      const link = await getFirstWikiLink(`[[note|${longAlias}]]`)
      expect(link?.alias).toBe(longAlias)
    })
  })

  describe('Multiple WikiLinks', () => {
    it('should parse multiple wiki links in same line', async () => {
      const ast = await parser.parse('[[a]] and [[b]] and [[c]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.length).toBe(5)
      expect((paragraph as any).children?.[0]?.type).toBe('wikiLink')
      expect((paragraph as any).children?.[2]?.type).toBe('wikiLink')
      expect((paragraph as any).children?.[4]?.type).toBe('wikiLink')
    })

    it('should parse wiki links on multiple lines', async () => {
      const ast = await parser.parse('[[a]]\n[[b]]\n[[c]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.filter(c => c.type === 'wikiLink').length).toBe(3)
    })

    it('should parse adjacent wiki links', async () => {
      const ast = await parser.parse('[[a]][[b]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.length).toBe(2)
    })
  })

  describe('Invalid/Malformed Cases', () => {
    it('should not parse single bracket', async () => {
      const ast = await parser.parse('[note]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should parse triple brackets as wikiLink with bracket in value', async () => {
      const ast = await parser.parse('[[[note]]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('wikiLink')
      expect(firstChild?.value).toBe('[note')
    })

    it('should handle unclosed wiki link', async () => {
      const ast = await parser.parse('[[note')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should handle unopened wiki link', async () => {
      const ast = await parser.parse('note]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })
  })

  describe('Round-trip Edge Cases', () => {
    const edgeCases = [
      '[[a]]',
      '[[中文]]',
      '[[📝]]',
      '[[file\\|name]]',
      '[[file\\#name]]',
      '[[note#section]]',
      '[[note#^blockid]]',
      '[[note|alias]]',
      '[[note#section|alias]]',
    ]

    edgeCases.forEach(input => {
      it(`should round-trip: ${input.replace(/\n/g, '\\n')}`, async () => {
        const ast = await parser.parse(input)
        const output = await parser.stringify(ast)
        expect(output.trim()).toBe(input)
      })
    })
  })
})
