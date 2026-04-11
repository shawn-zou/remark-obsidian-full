import { ObsidianParser } from '../../ObsidianParser'
import type { Embed } from '../../nodes'

describe('Embed Extension', () => {
  const parser = new ObsidianParser()

  describe('parse', () => {
    it('should parse basic embed', async () => {
      const ast = await parser.parse('![[Note Name]]')
      const paragraph = ast.children[0]
      expect(paragraph?.type).toBe('paragraph')
      const embed = (paragraph as any)?.children?.[0] as Embed
      expect(embed?.type).toBe('embed')
      expect(embed?.value).toBe('Note Name')
    })

    it('should parse embed with heading', async () => {
      const ast = await parser.parse('![[Note#Section]]')
      const embed = await getFirstEmbed(ast)
      expect(embed?.value).toBe('Note')
      expect(embed?.heading).toBe('Section')
    })

    it('should parse embed with block id', async () => {
      const ast = await parser.parse('![[Note#^block123]]')
      const embed = await getFirstEmbed(ast)
      expect(embed?.value).toBe('Note')
      expect(embed?.blockId).toBe('block123')
    })

    it('should parse embed with width', async () => {
      const ast = await parser.parse('![[image.png|100]]')
      const embed = await getFirstEmbed(ast)
      expect(embed?.value).toBe('image.png')
      expect(embed?.width).toBe(100)
    })

    it('should parse embed with width and height', async () => {
      const ast = await parser.parse('![[image.png|100x200]]')
      const embed = await getFirstEmbed(ast)
      expect(embed?.value).toBe('image.png')
      expect(embed?.width).toBe(100)
      expect(embed?.height).toBe(200)
    })
  })

  describe('stringify', () => {
    it('should stringify basic embed', async () => {
      const ast = await parser.parse('![[Note]]')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('![[Note]]')
    })

    it('should preserve heading', async () => {
      const ast = await parser.parse('![[Note#Section]]')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('![[Note#Section]]')
    })

    it('should preserve dimensions', async () => {
      const ast = await parser.parse('![[image.png|100x200]]')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('![[image.png|100x200]]')
    })
  })

  describe('round-trip', () => {
    const testCases = [
      '![[Note]]',
      '![[Note#Section]]',
      '![[Note#^block123]]',
      '![[image.png|100]]',
      '![[image.png|100x200]]'
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
    it('should reject empty embed', async () => {
      const ast = await parser.parse('![[]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('embed')
    })

    it('should reject unclosed embed', async () => {
      const ast = await parser.parse('![[note')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('text')
    })

    it('should reject embed without exclamation', async () => {
      const ast = await parser.parse('[[note]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('wikiLink')
      expect(firstChild?.type).not.toBe('embed')
    })

    it('should reject empty heading in embed', async () => {
      const ast = await parser.parse('![[note#]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('embed')
    })

    it('should reject empty block id in embed', async () => {
      const ast = await parser.parse('![[note#^]]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('embed')
    })

    it('should reject single bracket embed', async () => {
      const ast = await parser.parse('![note]')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('embed')
    })
  })
})

async function getFirstEmbed(ast: any): Promise<Embed | undefined> {
  const paragraph = ast.children[0]
  if (paragraph?.type === 'paragraph') {
    return paragraph.children?.[0] as Embed
  }
  return undefined
}
