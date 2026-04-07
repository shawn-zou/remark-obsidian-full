import { ObsidianParser } from '../ObsidianParser'
import type { Comment } from '../nodes'

describe('Comment Extension', () => {
  const parser = new ObsidianParser()

  describe('parse', () => {
    it('should parse basic comment', async () => {
      const ast = await parser.parse('%%comment text%%')
      const paragraph = ast.children[0]
      expect(paragraph?.type).toBe('paragraph')
      const comment = (paragraph as any)?.children?.[0] as Comment
      expect(comment?.type).toBe('comment')
      expect(comment?.value).toBe('comment text')
    })

    it('should parse comment with special characters', async () => {
      const ast = await parser.parse('%%text with **markdown** inside%%')
      const comment = await getFirstComment(ast)
      expect(comment?.type).toBe('comment')
    })

    it('should parse multiline comment', async () => {
      const ast = await parser.parse('%%line1\nline2%%')
      const comment = await getFirstComment(ast)
      expect(comment?.value).toContain('line1')
    })
  })

  describe('stringify', () => {
    it('should stringify basic comment', async () => {
      const ast = await parser.parse('%%comment%%')
      const text = await parser.stringify(ast)
      expect(text.trim()).toBe('%%comment%%')
    })
  })

  describe('round-trip', () => {
    const testCases = [
      '%%comment%%',
      '%%text with spaces%%'
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

async function getFirstComment(ast: any): Promise<Comment | undefined> {
  const paragraph = ast.children[0]
  if (paragraph?.type === 'paragraph') {
    return paragraph.children?.[0] as Comment
  }
  return undefined
}
