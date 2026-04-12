import { ObsidianParser } from '../../ObsidianParser'
import type { Highlight } from '../../nodes'

describe('Highlight Extension', () => {
  const parser = new ObsidianParser()

  describe('parse', () => {
    it('should parse basic highlight', async () => {
      const ast = await parser.parse('==highlighted text==')
      const paragraph = ast.children[0]
      expect(paragraph?.type).toBe('paragraph')
      const highlight = (paragraph as any)?.children?.[0] as Highlight
      expect(highlight?.type).toBe('highlight')
    })

    it('should parse highlight with nested content', async () => {
      const ast = await parser.parse('==text with **bold** inside==')
      const highlight = await getFirstHighlight(ast)
      expect(highlight?.type).toBe('highlight')
    })

    it('should parse multiple highlights', async () => {
      const ast = await parser.parse('==first== and ==second==')
      const paragraph = ast.children[0] as any
      expect(paragraph?.children?.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('stringify', () => {
    it('should stringify basic highlight', async () => {
      const ast = await parser.parse('==highlighted==')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('==highlighted==')
    })
  })

  describe('round-trip', () => {
    const testCases = [
      '==highlighted==',
      '==text with spaces=='
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
    it('should reject empty highlight', async () => {
      const ast = await parser.parse('====')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('highlight')
    })

    it('should reject unclosed highlight', async () => {
      const ast = await parser.parse('==text')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('text')
    })

    it('should reject unopened highlight', async () => {
      const ast = await parser.parse('text==')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('text')
    })

    it('should reject single equals marker', async () => {
      const ast = await parser.parse('=text=')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('highlight')
    })

    it('should reject triple equals marker', async () => {
      const ast = await parser.parse('===text===')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('highlight')
    })
  })
})

async function getFirstHighlight(ast: any): Promise<Highlight | undefined> {
  const paragraph = ast.children[0]
  if (paragraph?.type === 'paragraph') {
    return paragraph.children?.[0] as Highlight
  }
  return undefined
}
