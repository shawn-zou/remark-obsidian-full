import { ObsidianParser } from '../../ObsidianParser'
import type { Math, FootnoteReference, FootnoteDefinition } from '../../nodes'
import { describe, it, expect } from 'vitest'

describe('Math Edge Cases', () => {
  const parser = new ObsidianParser()

  async function getFirstMath(text: string): Promise<Math | undefined> {
    const ast = await parser.parse(text)
    const paragraph = ast.children[0]
    if (paragraph?.type === 'paragraph') {
      return (paragraph as any).children?.[0] as Math
    }
    return ast.children[0] as Math | undefined
  }

  describe('Inline Math', () => {
    it('should not parse inline math (not supported yet)', async () => {
      const ast = await parser.parse('$x = y$')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).not.toBe('math')
    })

    it('should parse empty inline math as invalid', async () => {
      const math = await getFirstMath('$$')
      expect(math?.type).not.toBe('math')
    })

    it('should parse inline math with spaces', async () => {
      const math = await getFirstMath('$x = y + z$')
      expect(math?.value).toBe('x = y + z')
    })

    it('should parse inline math with special chars', async () => {
      const math = await getFirstMath('$\\frac{1}{2}$')
      expect(math?.value).toBe('\\frac{1}{2}')
    })

    it('should parse inline math with unicode', async () => {
      const math = await getFirstMath('$α + β$')
      expect(math?.value).toBe('α + β')
    })

    it('should parse inline math at start of line', async () => {
      const ast = await parser.parse('$x$ text')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('math')
    })

    it('should parse inline math at end of line', async () => {
      const ast = await parser.parse('text $x$')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[1]?.type).toBe('math')
    })

    it('should parse multiple inline math', async () => {
      const ast = await parser.parse('$a$ and $b$ and $c$')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[0]?.type).toBe('math')
      expect(children?.[2]?.type).toBe('math')
      expect(children?.[4]?.type).toBe('math')
    })
  })

  describe('Block Math', () => {
    it('should not parse block math (not supported yet)', async () => {
      const ast = await parser.parse('$$\nx = y\n$$')
      const firstChild = ast.children[0]
      expect(firstChild?.type).not.toBe('math')
    })

    it('should not parse block math with multiple lines (not supported yet)', async () => {
      const ast = await parser.parse('$$\nx = y\nz = a\n$$')
      const firstChild = ast.children[0]
      expect(firstChild?.type).not.toBe('math')
    })

    it('should not parse block math with complex formula (not supported yet)', async () => {
      const ast = await parser.parse('$$\n\\int_a^b f(x) dx\n$$')
      const firstChild = ast.children[0]
      expect(firstChild?.type).not.toBe('math')
    })
  })

  describe('Math Content', () => {
    it('should parse math with greek letters', async () => {
      const math = await getFirstMath('$α β γ δ ε$')
      expect(math?.value).toBe('α β γ δ ε')
    })

    it('should parse math with subscripts', async () => {
      const math = await getFirstMath('$x_1 + x_2$')
      expect(math?.value).toBe('x_1 + x_2')
    })

    it('should parse math with superscripts', async () => {
      const math = await getFirstMath('$x^2 + y^2$')
      expect(math?.value).toBe('x^2 + y^2')
    })

    it('should parse math with fractions', async () => {
      const math = await getFirstMath('$\\frac{a}{b}$')
      expect(math?.value).toBe('\\frac{a}{b}')
    })

    it('should parse math with matrices', async () => {
      const math = await getFirstMath('$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$')
      expect(math?.value).toBe('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}')
    })

    it('should parse math with sums', async () => {
      const math = await getFirstMath('$\\sum_{i=1}^{n} x_i$')
      expect(math?.value).toBe('\\sum_{i=1}^{n} x_i')
    })

    it('should parse math with integrals', async () => {
      const math = await getFirstMath('$\\int_a^b f(x) dx$')
      expect(math?.value).toBe('\\int_a^b f(x) dx')
    })
  })

  describe('Math Boundaries', () => {
    it('should not parse single dollar', async () => {
      const ast = await parser.parse('$text')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should handle dollar in text', async () => {
      const ast = await parser.parse('Price is $100')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should handle escaped dollar', async () => {
      const ast = await parser.parse('\\$not math\\$')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })
  })

  describe('Round-trip', () => {
    const testCases = [
      '$x$',
      '$x = y$',
      '$\\frac{1}{2}$',
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

describe('Footnote Edge Cases', () => {
  const parser = new ObsidianParser()

  describe('Inline Footnote', () => {
    it('should parse simple inline footnote', async () => {
      const ast = await parser.parse('^[inline footnote]')
      const paragraph = ast.children[0]
      const footnote = (paragraph as any).children?.[0] as FootnoteReference
      expect(footnote?.type).toBe('footnoteReference')
      expect(footnote?.inline).toBe(true)
    })

    it('should parse inline footnote in text', async () => {
      const ast = await parser.parse('Text ^[inline] more')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[0]?.type).toBe('text')
      expect(children?.[1]?.type).toBe('footnoteReference')
      expect(children?.[2]?.type).toBe('text')
    })

    it('should parse inline footnote with complex content', async () => {
      const ast = await parser.parse('^[footnote with **bold** and *italic*]')
      const paragraph = ast.children[0]
      const footnote = (paragraph as any).children?.[0]
      expect(footnote?.type).toBe('footnoteReference')
    })

    it('should reject empty inline footnote', async () => {
      const ast = await parser.parse('^[]')
      const paragraph = ast.children[0]
      const footnote = (paragraph as any).children?.[0]
      expect(footnote?.type).not.toBe('footnoteReference')
    })
  })

  describe('Footnote Reference', () => {
    it('should parse simple footnote reference', async () => {
      const ast = await parser.parse('[^1]')
      const paragraph = ast.children[0]
      const footnote = (paragraph as any).children?.[0] as FootnoteReference
      expect(footnote?.type).toBe('footnoteReference')
      expect(footnote?.identifier).toBe('1')
    })

    it('should parse footnote reference with word identifier', async () => {
      const ast = await parser.parse('[^note]')
      const paragraph = ast.children[0]
      const footnote = (paragraph as any).children?.[0]
      expect(footnote?.identifier).toBe('note')
    })

    it('should parse footnote reference in text', async () => {
      const ast = await parser.parse('Text[^1]more')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[1]?.type).toBe('footnoteReference')
    })

    it('should parse multiple footnote references', async () => {
      const ast = await parser.parse('[^1] and [^2] and [^3]')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[0]?.identifier).toBe('1')
      expect(children?.[2]?.identifier).toBe('2')
      expect(children?.[4]?.identifier).toBe('3')
    })
  })

  describe('Footnote Definition', () => {
    it('should parse simple footnote definition', async () => {
      const ast = await parser.parse('[^1]: Definition')
      const definition = ast.children[0] as FootnoteDefinition
      expect(definition?.type).toBe('footnoteDefinition')
      expect(definition?.identifier).toBe('1')
    })

    it('should parse footnote definition with multiline content', async () => {
      const ast = await parser.parse('[^1]: Line 1\n    Line 2')
      const definition = ast.children[0]
      expect(definition?.type).toBe('footnoteDefinition')
    })

    it('should parse footnote definition with complex content', async () => {
      const ast = await parser.parse('[^1]: Definition with **bold**')
      const definition = ast.children[0]
      expect(definition?.type).toBe('footnoteDefinition')
    })

    it('should parse empty footnote definition', async () => {
      const ast = await parser.parse('[^1]:')
      const definition = ast.children[0]
      expect(definition?.type).toBe('footnoteDefinition')
    })
  })

  describe('Footnote with Reference and Definition', () => {
    it('should link reference to definition', async () => {
      const ast = await parser.parse('Text[^1]\n\n[^1]: Definition')
      expect(ast.children.length).toBe(2)
      const paragraph = ast.children[0]
      const definition = ast.children[1]
      expect((paragraph as any).children?.[1]?.type).toBe('footnoteReference')
      expect(definition?.type).toBe('footnoteDefinition')
    })
  })

  describe('Invalid/Malformed Cases', () => {
    it('should not parse single bracket', async () => {
      const ast = await parser.parse('[1]')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should not parse without caret', async () => {
      const ast = await parser.parse('[1]: Definition')
      const firstChild = ast.children[0]
      expect(firstChild?.type).not.toBe('footnoteDefinition')
    })

    it('should handle unclosed bracket', async () => {
      const ast = await parser.parse('[^1')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })
  })
})
