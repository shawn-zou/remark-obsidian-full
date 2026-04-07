import { ObsidianParser } from '../../ObsidianParser'
import type { Highlight, Comment } from '../../nodes'
import { describe, it, expect } from 'vitest'

describe('Highlight Edge Cases', () => {
  const parser = new ObsidianParser()

  async function getFirstHighlight(text: string): Promise<Highlight | undefined> {
    const ast = await parser.parse(text)
    const paragraph = ast.children[0]
    if (paragraph?.type === 'paragraph') {
      return (paragraph as any).children?.[0] as Highlight
    }
    return undefined
  }

  describe('Basic Highlight', () => {
    it('should parse simple highlight', async () => {
      const highlight = await getFirstHighlight('==text==')
      expect(highlight?.type).toBe('highlight')
    })

    it('should parse highlight with spaces', async () => {
      const highlight = await getFirstHighlight('==text with spaces==')
      expect(highlight?.type).toBe('highlight')
    })

    it('should parse empty highlight', async () => {
      const highlight = await getFirstHighlight('====')
      expect(highlight?.type).toBe('highlight')
    })

    it('should parse single character highlight', async () => {
      const highlight = await getFirstHighlight('==a==')
      expect(highlight?.type).toBe('highlight')
    })
  })

  describe('Highlight Content', () => {
    it('should parse highlight with unicode', async () => {
      const highlight = await getFirstHighlight('==中文高亮==')
      expect(highlight?.type).toBe('highlight')
    })

    it('should parse highlight with emoji', async () => {
      const highlight = await getFirstHighlight('==🎉emoji==')
      expect(highlight?.type).toBe('highlight')
    })

    it('should parse highlight with numbers', async () => {
      const highlight = await getFirstHighlight('==12345==')
      expect(highlight?.type).toBe('highlight')
    })

    it('should parse highlight with special chars', async () => {
      const highlight = await getFirstHighlight('==text!@#$%==')
      expect(highlight?.type).toBe('highlight')
    })

    it('should parse highlight with markdown', async () => {
      const highlight = await getFirstHighlight('==**bold** and *italic*==')
      expect(highlight?.type).toBe('highlight')
      expect((highlight as any)?.children?.length).toBeGreaterThan(1)
    })

    it('should parse highlight with wiki link', async () => {
      const highlight = await getFirstHighlight('==[[link]]==')
      expect(highlight?.type).toBe('highlight')
    })

    it('should parse highlight with tag', async () => {
      const highlight = await getFirstHighlight('==#tag==')
      expect(highlight?.type).toBe('highlight')
    })
  })

  describe('Highlight Boundaries', () => {
    it('should parse highlight at start of line', async () => {
      const ast = await parser.parse('==text== more')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('highlight')
    })

    it('should parse highlight at end of line', async () => {
      const ast = await parser.parse('text ==highlight==')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[1]?.type).toBe('highlight')
    })

    it('should parse highlight in middle', async () => {
      const ast = await parser.parse('before ==highlight== after')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[1]?.type).toBe('highlight')
    })

    it('should parse multiple highlights', async () => {
      const ast = await parser.parse('==one== and ==two== and ==three==')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[0]?.type).toBe('highlight')
      expect(children?.[2]?.type).toBe('highlight')
      expect(children?.[4]?.type).toBe('highlight')
    })

    it('should parse adjacent highlights', async () => {
      const ast = await parser.parse('==a====b==')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.length).toBe(2)
    })
  })

  describe('Nested Formatting', () => {
    it('should parse highlight inside bold', async () => {
      const ast = await parser.parse('**==highlight==**')
      const paragraph = ast.children[0]
      const strong = (paragraph as any).children?.[0]
      expect(strong?.type).toBe('strong')
      expect(strong?.children?.[0]?.type).toBe('highlight')
    })

    it('should parse bold inside highlight', async () => {
      const highlight = await getFirstHighlight('==**bold**==')
      expect(highlight?.type).toBe('highlight')
      expect((highlight as any)?.children?.[0]?.type).toBe('strong')
    })

    it('should parse highlight inside italic', async () => {
      const ast = await parser.parse('*==highlight==*')
      const paragraph = ast.children[0]
      const emphasis = (paragraph as any).children?.[0]
      expect(emphasis?.type).toBe('emphasis')
      expect(emphasis?.children?.[0]?.type).toBe('highlight')
    })

    it('should parse italic inside highlight', async () => {
      const highlight = await getFirstHighlight('==*italic*==')
      expect(highlight?.type).toBe('highlight')
      expect((highlight as any)?.children?.[0]?.type).toBe('emphasis')
    })
  })

  describe('Invalid/Malformed Cases', () => {
    it('should not parse single equals', async () => {
      const ast = await parser.parse('=text=')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should not parse unclosed highlight', async () => {
      const ast = await parser.parse('==text')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should not parse unopened highlight', async () => {
      const ast = await parser.parse('text==')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should handle triple equals', async () => {
      const ast = await parser.parse('===text===')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBeDefined()
    })
  })

  describe('Round-trip', () => {
    const testCases = [
      '==text==',
      '==中文==',
      '==**bold**==',
      '==*italic*==',
      '====',
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

describe('Comment Edge Cases', () => {
  const parser = new ObsidianParser()

  async function getFirstComment(text: string): Promise<Comment | undefined> {
    const ast = await parser.parse(text)
    const paragraph = ast.children[0]
    if (paragraph?.type === 'paragraph') {
      return (paragraph as any).children?.[0] as Comment
    }
    return undefined
  }

  describe('Basic Comment', () => {
    it('should parse simple comment', async () => {
      const comment = await getFirstComment('%%comment%%')
      expect(comment?.type).toBe('comment')
      expect(comment?.value).toBe('comment')
    })

    it('should parse empty comment', async () => {
      const comment = await getFirstComment('%%%%')
      expect(comment?.type).toBe('comment')
      expect(comment?.value).toBe('')
    })

    it('should parse comment with spaces', async () => {
      const comment = await getFirstComment('%%comment with spaces%%')
      expect(comment?.value).toBe('comment with spaces')
    })

    it('should parse single character comment', async () => {
      const comment = await getFirstComment('%%a%%')
      expect(comment?.value).toBe('a')
    })
  })

  describe('Comment Content', () => {
    it('should parse comment with unicode', async () => {
      const comment = await getFirstComment('%%中文注释%%')
      expect(comment?.value).toBe('中文注释')
    })

    it('should parse comment with emoji', async () => {
      const comment = await getFirstComment('%%🎉emoji%%')
      expect(comment?.value).toBe('🎉emoji')
    })

    it('should parse comment with special chars', async () => {
      const comment = await getFirstComment('%%!@#$%^&*()%%')
      expect(comment?.value).toBe('!@#$%^&*()')
    })

    it('should parse comment with newlines', async () => {
      const comment = await getFirstComment('%%line1\nline2%%')
      expect(comment?.value).toBe('line1\nline2')
    })

    it('should parse comment with markdown', async () => {
      const comment = await getFirstComment('%%**bold** and *italic*%%')
      expect(comment?.value).toBe('**bold** and *italic*')
    })

    it('should parse comment with wiki link', async () => {
      const comment = await getFirstComment('%%[[link]]%%')
      expect(comment?.value).toBe('[[link]]')
    })

    it('should parse comment with tag', async () => {
      const comment = await getFirstComment('%%#tag%%')
      expect(comment?.value).toBe('#tag')
    })

    it('should parse comment with highlight', async () => {
      const comment = await getFirstComment('%%==highlight==%%')
      expect(comment?.value).toBe('==highlight==')
    })
  })

  describe('Comment Boundaries', () => {
    it('should parse comment at start of line', async () => {
      const ast = await parser.parse('%%comment%% more')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('comment')
    })

    it('should parse comment at end of line', async () => {
      const ast = await parser.parse('text %%comment%%')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[1]?.type).toBe('comment')
    })

    it('should parse comment in middle', async () => {
      const ast = await parser.parse('before %%comment%% after')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[1]?.type).toBe('comment')
    })

    it('should parse multiple comments', async () => {
      const ast = await parser.parse('%%one%% and %%two%% and %%three%%')
      const paragraph = ast.children[0]
      const children = (paragraph as any).children
      expect(children?.[0]?.type).toBe('comment')
      expect(children?.[2]?.type).toBe('comment')
      expect(children?.[4]?.type).toBe('comment')
    })

    it('should parse adjacent comments', async () => {
      const ast = await parser.parse('%%a%%%%b%%')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.length).toBe(2)
    })
  })

  describe('Multiline Comments', () => {
    it('should parse multiline comment', async () => {
      const comment = await getFirstComment('%%line1\nline2\nline3%%')
      expect(comment?.value).toBe('line1\nline2\nline3')
    })

    it('should parse comment with blank lines', async () => {
      const comment = await getFirstComment('%%line1\n\nline2%%')
      expect(comment?.value).toBe('line1\n\nline2')
    })

    it('should parse very long comment', async () => {
      const longContent = 'a'.repeat(1000)
      const comment = await getFirstComment(`%%${longContent}%%`)
      expect(comment?.value).toBe(longContent)
    })
  })

  describe('Invalid/Malformed Cases', () => {
    it('should not parse single percent', async () => {
      const ast = await parser.parse('%text%')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should not parse unclosed comment', async () => {
      const ast = await parser.parse('%%text')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should not parse unopened comment', async () => {
      const ast = await parser.parse('text%%')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('text')
    })

    it('should handle triple percent', async () => {
      const ast = await parser.parse('%%%text%%%')
      const paragraph = ast.children[0]
      const firstChild = (paragraph as any).children?.[0]
      expect(firstChild?.type).toBeDefined()
    })
  })

  describe('Round-trip', () => {
    const testCases = [
      '%%comment%%',
      '%%中文%%',
      '%%%%',
      '%%line1\nline2%%',
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
