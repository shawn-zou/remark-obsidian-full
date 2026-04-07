import { ObsidianParser } from '../../ObsidianParser'
import { describe, it, expect } from 'vitest'

describe('Escape Edge Cases', () => {
  const parser = new ObsidianParser()

  describe('WikiLink Escaping', () => {
    it('should handle escaped pipe in value', async () => {
      const ast = await parser.parse('[[file\\|name]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('file|name')
    })

    it('should handle escaped hash in value', async () => {
      const ast = await parser.parse('[[file\\#name]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('file#name')
    })

    it('should handle escaped caret in value', async () => {
      const ast = await parser.parse('[[file\\^name]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('file^name')
    })

    it('should handle multiple escaped chars', async () => {
      const ast = await parser.parse('[[a\\|b\\#c\\^d]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('a|b#c^d')
    })

    it('should handle escaped backslash', async () => {
      const ast = await parser.parse('[[file\\\\name]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('file\\name')
    })

    it('should handle escaped pipe in heading', async () => {
      const ast = await parser.parse('[[note#head\\|ing]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.heading).toBe('head|ing')
    })

    it('should handle escaped pipe in alias', async () => {
      const ast = await parser.parse('[[note|alias\\|name]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.alias).toBe('alias|name')
    })

    it('should handle escaped hash in alias', async () => {
      const ast = await parser.parse('[[note|alias\\#hash]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.alias).toBe('alias#hash')
    })
  })

  describe('Embed Escaping', () => {
    it('should handle escaped pipe in embed', async () => {
      const ast = await parser.parse('![[file\\|name.png]]')
      const paragraph = ast.children[0]
      const embed = (paragraph as any).children?.[0]
      expect(embed?.value).toBe('file|name.png')
    })

    it('should handle escaped hash in embed', async () => {
      const ast = await parser.parse('![[file\\#name.png]]')
      const paragraph = ast.children[0]
      const embed = (paragraph as any).children?.[0]
      expect(embed?.value).toBe('file#name.png')
    })

    it('should handle escaped chars with dimensions', async () => {
      const ast = await parser.parse('![[file\\|name.png|100]]')
      const paragraph = ast.children[0]
      const embed = (paragraph as any).children?.[0]
      expect(embed?.value).toBe('file|name.png')
      expect(embed?.width).toBe(100)
    })
  })

  describe('Markdown Escaping', () => {
    it('should handle escaped asterisk', async () => {
      const ast = await parser.parse('\\*not bold\\*')
      const paragraph = ast.children[0]
      const text = (paragraph as any).children?.[0]
      expect(text?.value).toBe('*not bold*')
    })

    it('should handle escaped underscore', async () => {
      const ast = await parser.parse('\\_not italic\\_')
      const paragraph = ast.children[0]
      const text = (paragraph as any).children?.[0]
      expect(text?.value).toBe('_not italic_')
    })

    it('should handle escaped backtick', async () => {
      const ast = await parser.parse('\\`not code\\`')
      const paragraph = ast.children[0]
      const text = (paragraph as any).children?.[0]
      expect(text?.value).toBe('`not code`')
    })

    it('should handle escaped bracket', async () => {
      const ast = await parser.parse('\\[not link\\]')
      const paragraph = ast.children[0]
      const text = (paragraph as any).children?.[0]
      expect(text?.value).toBe('[not link]')
    })

    it('should handle escaped angle bracket', async () => {
      const ast = await parser.parse('\\<not html\\>')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })
  })

  describe('Mixed Escaping', () => {
    it('should handle wiki link with markdown escape', async () => {
      const ast = await parser.parse('[[note\\*name]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('note*name')
    })

    it('should handle escaped chars in complex structure', async () => {
      const ast = await parser.parse('**[[a\\|b]]**')
      const paragraph = ast.children[0]
      const strong = (paragraph as any).children?.[0]
      const link = strong?.children?.[0]
      expect(link?.value).toBe('a|b')
    })

    it('should preserve escape in round-trip', async () => {
      const input = '[[file\\|name]]'
      const ast = await parser.parse(input)
      const output = await parser.stringify(ast)
      expect(output.trim()).toBe(input)
    })
  })

  describe('Edge Cases', () => {
    it('should handle double backslash', async () => {
      const ast = await parser.parse('[[file\\\\name]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('file\\name')
    })

    it('should handle triple backslash before pipe', async () => {
      const ast = await parser.parse('[[file\\\\\\|name]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('file\\|name')
    })

    it('should handle backslash at end of value', async () => {
      const ast = await parser.parse('[[file\\\\]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('file\\')
    })

    it('should handle multiple consecutive escapes', async () => {
      const ast = await parser.parse('[[\\|\\#\\^]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('|#^')
    })

    it('should handle escape at start', async () => {
      const ast = await parser.parse('[[\\|name]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('|name')
    })
  })

  describe('Non-Escape Cases', () => {
    it('should not escape regular characters', async () => {
      const ast = await parser.parse('[[file\\aname]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('file\\aname')
    })

    it('should handle backslash before non-special char', async () => {
      const ast = await parser.parse('[[file\\aname]]')
      const paragraph = ast.children[0]
      const link = (paragraph as any).children?.[0]
      expect(link?.value).toBe('file\\aname')
    })
  })
})
