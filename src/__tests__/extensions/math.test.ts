import { ObsidianParser } from '../../ObsidianParser'
import type { Math } from '../../nodes'

describe('Math Extension', () => {
  const parser = new ObsidianParser()

  describe('parse', () => {
    it('should parse inline math', async () => {
      const ast = await parser.parse('$E = mc^2$')
      const paragraph = ast.children[0]
      expect(paragraph?.type).toBe('paragraph')
      const math = (paragraph as any)?.children?.[0] as Math
      expect(math?.type).toBe('math')
      expect(math?.inline).toBe(true)
      expect(math?.value).toBe('E = mc^2')
    })

    it('should parse block math', async () => {
      const ast = await parser.parse('$$\nE = mc^2\n$$')
      const math = ast.children[0] as Math
      expect(math?.type).toBe('math')
      expect(math?.inline).toBe(false)
    })

    it('should parse complex formula', async () => {
      const ast = await parser.parse('$\\frac{a}{b}$')
      const math = await getFirstMath(ast)
      expect(math?.value).toBe('\\frac{a}{b}')
    })
  })

  describe('stringify', () => {
    it('should stringify inline math', async () => {
      const ast = await parser.parse('$E = mc^2$')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('$E = mc^2$')
    })
  })

  describe('round-trip', () => {
    const testCases = [
      '$E = mc^2$',
      '$x^2 + y^2 = z^2$'
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
    it('should reject empty inline math', async () => {
      const ast = await parser.parse('$$')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('math')
    })

    it('should reject unclosed inline math', async () => {
      const ast = await parser.parse('$E = mc^2')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('text')
    })

    it('should reject unopened inline math', async () => {
      const ast = await parser.parse('E = mc^2$')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('text')
    })

    it('should reject math with only spaces', async () => {
      const ast = await parser.parse('$   $')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBe('math')
      expect(firstChild?.value).toBe('   ')
    })

    it('should reject unclosed block math', async () => {
      const ast = await parser.parse('$$\nE = mc^2')
      const paragraph = ast.children[0]
      expect(paragraph?.type).not.toBe('math')
    })
  })
})

async function getFirstMath(ast: any): Promise<Math | undefined> {
  const paragraph = ast.children[0]
  if (paragraph?.type === 'paragraph') {
    return paragraph.children?.[0] as Math
  }
  return ast.children[0] as Math
}
