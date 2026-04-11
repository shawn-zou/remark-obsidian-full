import { ObsidianParser } from '../../ObsidianParser'
import type { WikiLink } from '../../nodes'

describe('Escape Handling', () => {
  const parser = new ObsidianParser()

  describe('WikiLink escape', () => {
    it('should unescape pipe in filename', async () => {
      const ast = await parser.parse('[[file\\|name]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('file|name')
    })

    it('should unescape hash in filename', async () => {
      const ast = await parser.parse('[[file\\#name]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('file#name')
    })

    it('should unescape caret in filename', async () => {
      const ast = await parser.parse('[[file\\^name]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('file^name')
    })

    it('should handle multiple escaped chars', async () => {
      const ast = await parser.parse('[[file\\|name\\#test]]')
      const link = await getFirstWikiLink(ast)
      expect(link?.value).toBe('file|name#test')
    })
  })

  describe('round-trip with escape', () => {
    const testCases = [
      '[[file\\|name]]',
      '[[file\\#name]]',
      '[[file\\^name]]'
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
