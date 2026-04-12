import { ObsidianParser } from '../../ObsidianParser'
import { describe, it, expect } from 'vitest'

describe('Parser Integration Edge Cases', () => {
  const parser = new ObsidianParser()

  describe('Mixed Syntax', () => {
    it('should parse wiki link with tag', async () => {
      const ast = await parser.parse('[[note]] #tag')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('wikiLink')
      expect((paragraph as any).children?.[2]?.type).toBe('tag')
    })

    it('should parse embed with highlight', async () => {
      const ast = await parser.parse('![[image.png]] ==highlighted==')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('embed')
      expect((paragraph as any).children?.[2]?.type).toBe('highlight')
    })

    it('should parse comment with wiki link inside', async () => {
      const ast = await parser.parse('%%[[hidden link]]%%')
      const firstChild = ast.children[0]
      if (firstChild?.type === 'comment') {
        expect(firstChild?.type).toBe('comment')
        expect(firstChild?.value).toBe('[[hidden link]]')
      } else if (firstChild?.type === 'paragraph') {
        const comment = (firstChild as any).children?.[0]
        expect(comment?.type).toBe('comment')
        expect(comment?.value).toBe('[[hidden link]]')
      }
    })

    it('should parse callout with multiple elements', async () => {
      const ast = await parser.parse('> [!note]\n> [[link]] and #tag and ==highlight==')
      const callout = ast.children[0]
      expect(callout?.type).toBe('callout')
    })

    it('should parse nested formatting', async () => {
      const ast = await parser.parse('**[[link|**bold**]]**')
      const paragraph = ast.children[0]
      expect((paragraph as any).children?.[0]?.type).toBe('strong')
    })
  })

  describe('Complex Documents', () => {
    it('should parse document with all syntax types', async () => {
      const doc = `# Title

A [[wiki link]] and ![[embed.png|100]] with #tag.

> [!note] Callout
> Content with ==highlight== and %%comment%%

Math: $x = y$

Footnote[^1]

[^1]: Definition
`
      const ast = await parser.parse(doc)
      expect(ast.children.length).toBeGreaterThan(0)
    })

    it('should parse document with frontmatter', async () => {
      const doc = `---
title: Test
tags: [tag1, tag2]
---

# Content

[[link]] #tag
`
      const ast = await parser.parse(doc)
      expect(ast.children[0]?.type).toBe('yaml')
    })

    it('should parse document with code blocks', async () => {
      const doc = `\`\`\`javascript
const link = "[[note]]"
\`\`\`

Text [[real-link]] after.
`
      const ast = await parser.parse(doc)
      expect(ast.children[0]?.type).toBe('code')
      const paragraph = ast.children[1]
      expect((paragraph as any).children?.[1]?.type).toBe('wikiLink')
    })

    it('should parse document with tables', async () => {
      const doc = `| Column | Link |
|--------|------|
| Value  | [[note]] |
`
      const ast = await parser.parse(doc)
      expect(ast.children[0]?.type).toBe('table')
    })
  })

  describe('Edge Cases with Markdown', () => {
    it('should handle wiki link in heading', async () => {
      const ast = await parser.parse('# [[note]] Title')
      const heading = ast.children[0]
      expect(heading?.type).toBe('heading')
      expect((heading as any).children?.[0]?.type).toBe('wikiLink')
    })

    it('should handle tag in heading', async () => {
      const ast = await parser.parse('# Title #tag')
      const heading = ast.children[0]
      expect(heading?.type).toBe('heading')
      expect((heading as any).children?.[1]?.type).toBe('tag')
    })

    it('should handle wiki link in list', async () => {
      const ast = await parser.parse('- [[note]]\n- [[other]]')
      const list = ast.children[0]
      expect(list?.type).toBe('list')
    })

    it('should handle embed in blockquote', async () => {
      const ast = await parser.parse('> ![[image.png]]')
      const blockquote = ast.children[0]
      expect(blockquote?.type).toBe('blockquote')
    })

    it('should handle highlight in bold', async () => {
      const ast = await parser.parse('**==highlight==**')
      const paragraph = ast.children[0]
      const strong = (paragraph as any).children?.[0]
      expect(strong?.type).toBe('strong')
      expect(strong?.children?.[0]?.type).toBe('highlight')
    })

    it('should handle wiki link in italic', async () => {
      const ast = await parser.parse('*[[note]]*')
      const paragraph = ast.children[0]
      const emphasis = (paragraph as any).children?.[0]
      expect(emphasis?.type).toBe('emphasis')
      expect(emphasis?.children?.[0]?.type).toBe('wikiLink')
    })
  })

  describe('Parsing Edge Cases', () => {
    it('should handle empty document', async () => {
      const ast = await parser.parse('')
      expect(ast.type).toBe('root')
      expect(ast.children.length).toBe(0)
    })

    it('should handle whitespace only', async () => {
      const ast = await parser.parse('   \n\n   ')
      expect(ast.type).toBe('root')
    })

    it('should handle very long line', async () => {
      const longLine = 'a'.repeat(10000)
      const ast = await parser.parse(longLine)
      expect(ast.type).toBe('root')
    })

    it('should handle many nested elements', async () => {
      const nested = '**bold *italic `code`* **'
      const ast = await parser.parse(nested)
      expect(ast.type).toBe('root')
    })

    it('should handle mixed line endings', async () => {
      const doc = 'line1\nline2\r\nline3\rline4'
      const ast = await parser.parse(doc)
      expect(ast.type).toBe('root')
    })
  })

  describe('Stringify Edge Cases', () => {
    it('should preserve original formatting', async () => {
      const input = '# Title\n\n[[link]] and #tag'
      const ast = await parser.parse(input)
      const output = await parser.stringify(ast)
      expect(output.trim()).toBe(input)
    })

    it('should handle complex nested structure', async () => {
      const input = '**[[link|**nested**]]**'
      const ast = await parser.parse(input)
      const output = await parser.stringify(ast)
      expect(output.trim()).toBe(input)
    })

    it('should handle multiple consecutive elements', async () => {
      const input = '[[a]][[b]][[c]]'
      const ast = await parser.parse(input)
      const output = await parser.stringify(ast)
      expect(output.trim()).toBe(input)
    })
  })

  describe('Error Recovery', () => {
    it('should handle unclosed wiki link gracefully', async () => {
      const ast = await parser.parse('[[unclosed')
      expect(ast.type).toBe('root')
    })

    it('should handle unclosed embed gracefully', async () => {
      const ast = await parser.parse('![[unclosed')
      expect(ast.type).toBe('root')
    })

    it('should handle unclosed highlight gracefully', async () => {
      const ast = await parser.parse('==unclosed')
      expect(ast.type).toBe('root')
    })

    it('should handle unclosed comment gracefully', async () => {
      const ast = await parser.parse('%%unclosed')
      expect(ast.type).toBe('root')
    })

    it('should continue parsing after error', async () => {
      const ast = await parser.parse('[[unclosed\n\n[[valid]]')
      expect(ast.type).toBe('root')
      expect(ast.children.length).toBeGreaterThan(0)
    })
  })

  describe('Performance Edge Cases', () => {
    it('should handle many wiki links', async () => {
      const links = Array(100).fill('[[link]]').join(' ')
      const ast = await parser.parse(links)
      expect(ast.type).toBe('root')
    })

    it('should handle deeply nested callouts', async () => {
      let doc = '> [!note]\n'
      for (let i = 0; i < 10; i++) {
        doc += '> '.repeat(i + 1) + '[!tip]\n'
      }
      const ast = await parser.parse(doc)
      expect(ast.type).toBe('root')
    })

    it('should handle large document', async () => {
      const sections = Array(50).fill('# Section\n\n[[link]] #tag\n\nParagraph text.\n\n').join('')
      const ast = await parser.parse(sections)
      expect(ast.type).toBe('root')
    })
  })

  describe('Query and Traversal', () => {
    it('should find nodes by type', async () => {
      const ast = await parser.parse('[[link]] and #tag')
      const wikiLinks = parser.findNodesByType(ast, 'wikiLink')
      expect(wikiLinks.length).toBe(1)
    })

    it('should find multiple node types', async () => {
      const ast = await parser.parse('[[link]] #tag ==highlight==')
      const nodes = parser.findNodesByType(ast, ['wikiLink', 'tag', 'highlight'])
      expect(nodes.length).toBe(3)
    })

    it('should query with filter', async () => {
      const ast = await parser.parse('[[a]] [[long-name]] [[bc]]')
      const nodes = parser.query(ast, {
        type: 'wikiLink',
        filter: (node: any) => node.value.length > 1
      })
      expect(nodes.length).toBe(2)
    })

    it('should visit all nodes', async () => {
      const ast = await parser.parse('[[link]] #tag')
      const types: string[] = []
      parser.visit(ast, (node: any) => {
        types.push(node.type)
      })
      expect(types.length).toBeGreaterThan(0)
    })

    it('should visit by type', async () => {
      const ast = await parser.parse('[[link]] #tag ==highlight==')
      const tags: string[] = []
      parser.visitByType(ast, 'tag', (node: any) => {
        tags.push(node.value)
      })
      expect(tags.length).toBe(1)
    })
  })

  describe('Hook System', () => {
    it('should execute beforeParse hook', async () => {
      let called = false
      parser.hooks.beforeParse(() => {
        called = true
        return 'modified'
      })
      await parser.parse('test')
      expect(called).toBe(true)
    })

    it('should execute afterParse hook', async () => {
      let called = false
      parser.hooks.afterParse((ast) => {
        called = true
        return ast
      })
      await parser.parse('test')
      expect(called).toBe(true)
    })

    it('should execute beforeStringify hook', async () => {
      let called = false
      const ast = await parser.parse('test')
      parser.hooks.beforeStringify((ast) => {
        called = true
        return ast
      })
      await parser.stringify(ast)
      expect(called).toBe(true)
    })

    it('should execute afterStringify hook', async () => {
      let called = false
      const ast = await parser.parse('test')
      parser.hooks.afterStringify((text) => {
        called = true
        return text
      })
      await parser.stringify(ast)
      expect(called).toBe(true)
    })
  })
})
