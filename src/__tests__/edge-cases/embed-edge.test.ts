import { ObsidianParser } from '../../ObsidianParser'
import type { Embed } from '../../nodes'
import { describe, it, expect } from 'vitest'

describe('Embed Edge Cases', () => {
  const parser = new ObsidianParser()

  async function getFirstEmbed(text: string): Promise<Embed | undefined> {
    const ast = await parser.parse(text)
    const paragraph = ast.children[0]
    if (paragraph?.type === 'paragraph') {
      return (paragraph as any).children?.[0] as Embed
    }
    return undefined
  }

  describe('Empty and Minimal Cases', () => {
    it('should handle empty embed as invalid', async () => {
      const embed = await getFirstEmbed('![[]]')
      expect(embed?.type).not.toBe('embed')
    })

    it('should handle single character', async () => {
      const embed = await getFirstEmbed('![[a]]')
      expect(embed?.value).toBe('a')
    })

    it('should handle unicode filename', async () => {
      const embed = await getFirstEmbed('![[图片.png]]')
      expect(embed?.value).toBe('图片.png')
    })

    it('should handle emoji in filename', async () => {
      const embed = await getFirstEmbed('![[📷photo.jpg]]')
      expect(embed?.value).toBe('📷photo.jpg')
    })
  })

  describe('File Extensions', () => {
    it('should handle image files', async () => {
      const embed = await getFirstEmbed('![[image.png]]')
      expect(embed?.value).toBe('image.png')
    })

    it('should handle markdown files', async () => {
      const embed = await getFirstEmbed('![[note.md]]')
      expect(embed?.value).toBe('note.md')
    })

    it('should handle pdf files', async () => {
      const embed = await getFirstEmbed('![[document.pdf]]')
      expect(embed?.value).toBe('document.pdf')
    })

    it('should handle files without extension', async () => {
      const embed = await getFirstEmbed('![[README]]')
      expect(embed?.value).toBe('README')
    })

    it('should handle multiple dots in filename', async () => {
      const embed = await getFirstEmbed('![[file.name.with.dots.md]]')
      expect(embed?.value).toBe('file.name.with.dots.md')
    })
  })

  describe('Dimensions Edge Cases', () => {
    it('should handle width only', async () => {
      const embed = await getFirstEmbed('![[image.png|100]]')
      expect(embed?.width).toBe(100)
      expect(embed?.height).toBeUndefined()
    })

    it('should handle width and height', async () => {
      const embed = await getFirstEmbed('![[image.png|100x200]]')
      expect(embed?.width).toBe(100)
      expect(embed?.height).toBe(200)
    })

    it('should handle large dimensions', async () => {
      const embed = await getFirstEmbed('![[image.png|9999x9999]]')
      expect(embed?.width).toBe(9999)
      expect(embed?.height).toBe(9999)
    })

    it('should handle single digit dimensions', async () => {
      const embed = await getFirstEmbed('![[image.png|1x1]]')
      expect(embed?.width).toBe(1)
      expect(embed?.height).toBe(1)
    })

    it('should handle dimensions with zero', async () => {
      const embed = await getFirstEmbed('![[image.png|0x0]]')
      expect(embed?.width).toBe(0)
      expect(embed?.height).toBe(0)
    })

    it('should handle width with alias after', async () => {
      const embed = await getFirstEmbed('![[image.png|100|alias]]')
      expect(embed?.width).toBe(100)
    })
  })

  describe('Heading and Block ID', () => {
    it('should handle heading only', async () => {
      const embed = await getFirstEmbed('![[note#section]]')
      expect(embed?.value).toBe('note')
      expect(embed?.heading).toBe('section')
    })

    it('should handle block id only', async () => {
      const embed = await getFirstEmbed('![[note#^block123]]')
      expect(embed?.value).toBe('note')
      expect(embed?.blockId).toBe('block123')
    })

    it('should handle heading with dimensions', async () => {
      const embed = await getFirstEmbed('![[note#section|100]]')
      expect(embed?.heading).toBe('section')
      expect(embed?.width).toBe(100)
    })

    it('should handle block id with dimensions', async () => {
      const embed = await getFirstEmbed('![[note#^block|100x200]]')
      expect(embed?.blockId).toBe('block')
      expect(embed?.width).toBe(100)
      expect(embed?.height).toBe(200)
    })

    it('should handle empty heading as invalid', async () => {
      const ast = await parser.parse('![[note#]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('embed')
    })

    it('should handle empty block id as invalid', async () => {
      const ast = await parser.parse('![[note#^]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('embed')
    })
  })

  describe('Special Characters', () => {
    it('should handle escaped pipe in filename', async () => {
      const embed = await getFirstEmbed('![[file\\|name.png]]')
      expect(embed?.value).toBe('file|name.png')
    })

    it('should handle escaped hash in filename', async () => {
      const embed = await getFirstEmbed('![[file\\#name.png]]')
      expect(embed?.value).toBe('file#name.png')
    })

    it('should handle spaces in filename', async () => {
      const embed = await getFirstEmbed('![[file name with spaces.png]]')
      expect(embed?.value).toBe('file name with spaces.png')
    })

    it('should handle special URL chars', async () => {
      const embed = await getFirstEmbed('![[file%20name.png]]')
      expect(embed?.value).toBe('file%20name.png')
    })

    it('should handle parentheses in filename', async () => {
      const embed = await getFirstEmbed('![[file (1).png]]')
      expect(embed?.value).toBe('file (1).png')
    })

    it('should reject square brackets in filename', async () => {
      const ast = await parser.parse('![[file[1].png]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('embed')
    })
  })

  describe('Multiple Embeds', () => {
    it('should parse multiple embeds in same line', async () => {
      const ast = await parser.parse('![[a.png]] ![[b.png]] ![[c.png]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.length).toBe(5)
      expect((paragraph as any).children?.[0]?.type).toBe('embed')
      expect((paragraph as any).children?.[2]?.type).toBe('embed')
      expect((paragraph as any).children?.[4]?.type).toBe('embed')
    })

    it('should parse embeds on multiple lines', async () => {
      const ast = await parser.parse('![[a.png]]\n![[b.png]]\n![[c.png]]')
      const paragraph = ast.children[0]
      const embeds = (paragraph as any).children?.filter((c: any) => c.type === 'embed')
      expect(embeds?.length).toBe(3)
    })

    it('should parse adjacent embeds', async () => {
      const ast = await parser.parse('![[a.png]]![[b.png]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.length).toBe(2)
    })
  })

  describe('Mixed with WikiLinks', () => {
    it('should parse embed and wikilink together', async () => {
      const ast = await parser.parse('![[embed]] [[link]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('embed')
      expect((paragraph as any).children?.[2]?.type).toBe('wikiLink')
    })

    it('should parse wikilink and embed together', async () => {
      const ast = await parser.parse('[[link]] ![[embed]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('wikiLink')
      expect((paragraph as any).children?.[2]?.type).toBe('embed')
    })
  })

  describe('Invalid/Malformed Cases', () => {
    it('should not parse empty embed as valid', async () => {
      const ast = await parser.parse('![[]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).not.toBe('embed')
    })

    it('should handle unclosed embed', async () => {
      const ast = await parser.parse('![[note')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should handle missing exclamation', async () => {
      const ast = await parser.parse('[[note]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('wikiLink')
    })

    it('should handle double exclamation', async () => {
      const ast = await parser.parse('!![[note]]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })
  })

  describe('Round-trip Edge Cases', () => {
    const edgeCases = [
      '![[a]]',
      '![[图片.png]]',
      '![[file\\|name.png]]',
      '![[note#section]]',
      '![[note#^block]]',
      '![[image.png|100]]',
      '![[image.png|100x200]]',
      '![[note#section|100]]',
    ]

    edgeCases.forEach(input => {
      it(`should round-trip: ${input}`, async () => {
        const ast = await parser.parse(input)
        const output = await parser.stringify(ast)
        expect(output.trim()).toBe(input)
      })
    })
  })
})
