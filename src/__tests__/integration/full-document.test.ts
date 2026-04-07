import { ObsidianParser } from '../ObsidianParser'

describe('Integration Tests', () => {
  const parser = new ObsidianParser()

  describe('full document', () => {
    it('should parse complete document with multiple elements', async () => {
      const input = `---
title: Test Document
tags:
  - test
  - integration
---

# Heading

This is a paragraph with a [[wiki link]] and #tag.

![[embedded-image.png|200]]

==highlighted text==

%%comment%%

$inline math$

\`\`\`javascript
code block
\`\`\`
`
      const ast = await parser.parse(input)
      expect(ast.type).toBe('root')
      expect(ast.children.length).toBeGreaterThan(0)
    })

    it('should handle nested structures', async () => {
      const input = `> [!note] Callout with [[link]]
> Content with **bold** and #tag
> > Nested callout`
      
      const ast = await parser.parse(input)
      expect(ast.type).toBe('root')
    })
  })

  describe('mixed syntax', () => {
    it('should parse wiki link inside highlight', async () => {
      const ast = await parser.parse('==text with [[link]] inside==')
      expect(ast.type).toBe('root')
    })

    it('should parse multiple elements in one line', async () => {
      const ast = await parser.parse('Text [[link]] more #tag and ==highlight==')
      expect(ast.type).toBe('root')
    })

    it('should parse embed and wiki link together', async () => {
      const ast = await parser.parse('![[embed]] and [[link]]')
      expect(ast.type).toBe('root')
    })
  })

  describe('round-trip consistency', () => {
    const documents = [
      '[[Note]]',
      '#tag',
      '==highlight==',
      '%%comment%%',
      '$E = mc^2$',
      '![[image.png|100x200]]'
    ]

    documents.forEach(input => {
      it(`should round-trip: ${input}`, async () => {
        const ast = await parser.parse(input)
        const output = await parser.stringify(ast)
        expect(output.trim()).toBe(input)
      })
    })
  })
})
