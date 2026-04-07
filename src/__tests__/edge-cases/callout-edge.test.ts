import { ObsidianParser } from '../../ObsidianParser'
import type { Callout } from '../../nodes'
import { describe, it, expect } from 'vitest'

describe('Callout Edge Cases', () => {
  const parser = new ObsidianParser()

  async function getFirstCallout(text: string): Promise<Callout | undefined> {
    const ast = await parser.parse(text)
    return ast.children[0] as Callout | undefined
  }

  describe('Basic Callout Types', () => {
    it('should parse note callout', async () => {
      const callout = await getFirstCallout('> [!note]\n> content')
      expect(callout?.type).toBe('callout')
      expect(callout?.calloutType).toBe('note')
    })

    it('should parse info callout', async () => {
      const callout = await getFirstCallout('> [!info]\n> content')
      expect(callout?.calloutType).toBe('info')
    })

    it('should parse tip callout', async () => {
      const callout = await getFirstCallout('> [!tip]\n> content')
      expect(callout?.calloutType).toBe('tip')
    })

    it('should parse warning callout', async () => {
      const callout = await getFirstCallout('> [!warning]\n> content')
      expect(callout?.calloutType).toBe('warning')
    })

    it('should parse danger callout', async () => {
      const callout = await getFirstCallout('> [!danger]\n> content')
      expect(callout?.calloutType).toBe('danger')
    })

    it('should parse bug callout', async () => {
      const callout = await getFirstCallout('> [!bug]\n> content')
      expect(callout?.calloutType).toBe('bug')
    })

    it('should parse example callout', async () => {
      const callout = await getFirstCallout('> [!example]\n> content')
      expect(callout?.calloutType).toBe('example')
    })

    it('should parse quote callout', async () => {
      const callout = await getFirstCallout('> [!quote]\n> content')
      expect(callout?.calloutType).toBe('quote')
    })

    it('should parse success callout', async () => {
      const callout = await getFirstCallout('> [!success]\n> content')
      expect(callout?.calloutType).toBe('success')
    })

    it('should parse failure callout', async () => {
      const callout = await getFirstCallout('> [!failure]\n> content')
      expect(callout?.calloutType).toBe('failure')
    })
  })

  describe('Callout with Title', () => {
    it('should parse callout with title', async () => {
      const callout = await getFirstCallout('> [!note] Title\n> content')
      expect(callout?.title).toBe('Title')
    })

    it('should parse callout with empty title', async () => {
      const callout = await getFirstCallout('> [!note]\n> content')
      expect(callout?.title).toBeUndefined()
    })

    it('should parse callout with long title', async () => {
      const longTitle = 'This is a very long title with many words'
      const callout = await getFirstCallout(`> [!note] ${longTitle}\n> content`)
      expect(callout?.title).toBe(longTitle)
    })

    it('should parse callout with title containing special chars', async () => {
      const callout = await getFirstCallout('> [!note] Title with *bold* and _italic_\n> content')
      expect(callout?.title).toContain('*bold*')
    })

    it('should parse callout with unicode title', async () => {
      const callout = await getFirstCallout('> [!note] 中文标题\n> content')
      expect(callout?.title).toBe('中文标题')
    })
  })

  describe('Foldable Callouts', () => {
    it('should parse foldable callout with +', async () => {
      const callout = await getFirstCallout('> [!note]+\n> content')
      expect(callout?.foldable).toBe('+')
    })

    it('should parse foldable callout with -', async () => {
      const callout = await getFirstCallout('> [!note]-\n> content')
      expect(callout?.foldable).toBe('-')
    })

    it('should parse foldable callout with title', async () => {
      const callout = await getFirstCallout('> [!note]+ Title\n> content')
      expect(callout?.foldable).toBe('+')
      expect(callout?.title).toBe('Title')
    })
  })

  describe('Callout Content', () => {
    it('should parse callout with single line content', async () => {
      const callout = await getFirstCallout('> [!note]\n> Single line')
      expect(callout?.children?.length).toBeGreaterThan(0)
    })

    it('should parse callout with multi-line content', async () => {
      const callout = await getFirstCallout('> [!note]\n> Line 1\n> Line 2\n> Line 3')
      expect(callout?.type).toBe('callout')
    })

    it('should parse callout with empty content', async () => {
      const callout = await getFirstCallout('> [!note]')
      expect(callout?.type).toBe('callout')
    })

    it('should parse callout with code block', async () => {
      const callout = await getFirstCallout('> [!note]\n> ```\n> code\n> ```')
      expect(callout?.type).toBe('callout')
    })

    it('should parse callout with list', async () => {
      const callout = await getFirstCallout('> [!note]\n> - item 1\n> - item 2')
      expect(callout?.type).toBe('callout')
    })

    it('should parse callout with nested callout', async () => {
      const ast = await parser.parse('> [!note]\n> > [!tip]\n> > nested')
      expect(ast.children.length).toBe(1)
    })
  })

  describe('Case Sensitivity', () => {
    it('should handle uppercase type', async () => {
      const callout = await getFirstCallout('> [!NOTE]\n> content')
      expect(callout?.calloutType).toBe('note')
    })

    it('should handle mixed case type', async () => {
      const callout = await getFirstCallout('> [!NoTe]\n> content')
      expect(callout?.calloutType).toBe('note')
    })

    it('should handle custom type', async () => {
      const callout = await getFirstCallout('> [!custom]\n> content')
      expect(callout?.calloutType).toBe('custom')
    })
  })

  describe('Edge Cases', () => {
    it('should handle callout without space after brackets', async () => {
      const ast = await parser.parse('> [!note]\n> content')
      expect(ast.children[0]?.type).toBe('callout')
    })

    it('should handle multiple callouts', async () => {
      const ast = await parser.parse('> [!note]\n> first\n\n> [!tip]\n> second')
      expect(ast.children.length).toBe(2)
      expect((ast.children[0] as Callout)?.calloutType).toBe('note')
      expect((ast.children[1] as Callout)?.calloutType).toBe('tip')
    })

    it('should handle callout after paragraph', async () => {
      const ast = await parser.parse('Paragraph\n\n> [!note]\n> content')
      expect(ast.children[0]?.type).toBe('paragraph')
      expect(ast.children[1]?.type).toBe('callout')
    })

    it('should not parse regular blockquote as callout', async () => {
      const ast = await parser.parse('> Regular blockquote')
      expect(ast.children[0]?.type).toBe('blockquote')
      expect(ast.children[0]?.type).not.toBe('callout')
    })

    it('should handle callout with wiki link', async () => {
      const callout = await getFirstCallout('> [!note]\n> [[link]]')
      expect(callout?.type).toBe('callout')
    })

    it('should handle callout with embed', async () => {
      const callout = await getFirstCallout('> [!note]\n> ![[image.png]]')
      expect(callout?.type).toBe('callout')
    })

    it('should handle callout with tag', async () => {
      const callout = await getFirstCallout('> [!note]\n> #tag')
      expect(callout?.type).toBe('callout')
    })
  })

  describe('Invalid/Malformed Cases', () => {
    it('should not parse without exclamation', async () => {
      const ast = await parser.parse('> [note]\n> content')
      expect(ast.children[0]?.type).toBe('blockquote')
    })

    it('should not parse with space in brackets', async () => {
      const ast = await parser.parse('> [! note]\n> content')
      expect(ast.children[0]?.type).toBe('blockquote')
    })

    it('should not parse without closing bracket', async () => {
      const ast = await parser.parse('> [!note\n> content')
      expect(ast.children[0]?.type).toBe('blockquote')
    })

    it('should handle empty type', async () => {
      const ast = await parser.parse('> [!]\n> content')
      expect(ast.children[0]?.type).toBe('blockquote')
    })
  })

  describe('Round-trip', () => {
    const testCases = [
      '> [!note]\n> content',
      '> [!tip] Title\n> content',
      '> [!warning]+\n> content',
      '> [!danger]- Title\n> content',
    ]

    testCases.forEach(input => {
      it(`should round-trip: ${input.replace(/\n/g, '\\n')}`, async () => {
        const ast = await parser.parse(input)
        const output = await parser.stringify(ast)
        expect(output.trim()).toBe(input)
      })
    })
  })
})
