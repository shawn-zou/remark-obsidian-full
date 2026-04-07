import { ObsidianParser } from '../ObsidianParser'
import { SafeTextReplacer } from '../../utils/SafeTextReplacer'
import { ASTSafeExecutor } from '../../utils/ASTSafeExecutor'
import type { Root } from 'mdast'
import type { RuleContext } from '../../core/types'

function createMockContext(body: string, ast?: Root): RuleContext {
	return {
		file: {} as any,
		frontmatter: {},
		body,
		ast,
		astDirty: false,
		originalFrontmatter: {},
		originalBody: body,
		violations: [],
		logs: [],
		metadata: new Map()
	}
}

describe('Rules Impact on Special Syntax', () => {
	const parser = new ObsidianParser()

	describe('StrongStyleRule Impact', () => {
		const convertStrongStyle = (text: string, ast: Root, fromStyle: '__' | '**', toStyle: '__' | '**'): string => {
			const replacer = new SafeTextReplacer(ast)
			if (fromStyle === '__' && toStyle === '**') {
				return replacer.safeReplace(text, /(?<!\w)__(?!_)([^_]+)__(?!_)/g, '**$1**')
			} else if (fromStyle === '**' && toStyle === '__') {
				return replacer.safeReplace(text, /(?<!\*)\*\*(?!\*)([^*]+)\*\*(?!\*)/g, '__$1__')
			}
			return text
		}

		it('should convert __ to ** without breaking WikiLink', async () => {
			const input = '__bold with [[Note|Alias]] inside__'
			const ast = await parser.parse(input)
			const result = convertStrongStyle(input, ast, '__', '**')
			expect(result).toBe('**bold with [[Note|Alias]] inside**')
		})

		it('should convert ** to __ without breaking WikiLink', async () => {
			const input = '**bold with [[Note|Alias]] inside**'
			const ast = await parser.parse(input)
			const result = convertStrongStyle(input, ast, '**', '__')
			expect(result).toBe('__bold with [[Note|Alias]] inside__')
		})

		it('should NOT modify WikiLink with underscores', async () => {
			const input = 'See [[Note_with_underscore]] and __bold__'
			const ast = await parser.parse(input)
			const result = convertStrongStyle(input, ast, '__', '**')
			expect(result).toContain('[[Note_with_underscore]]')
			expect(result).toContain('**bold**')
		})

		it('should NOT modify code blocks', async () => {
			const input = `__bold text__

\`\`\`javascript
const x = "__not_bold__";
\`\`\``
			const ast = await parser.parse(input)
			const result = convertStrongStyle(input, ast, '__', '**')
			expect(result).toContain('const x = "__not_bold__"')
			expect(result).toContain('**bold text**')
		})

		it('should NOT modify inline code', async () => {
			const input = '__bold__ and `__not_bold__`'
			const ast = await parser.parse(input)
			const result = convertStrongStyle(input, ast, '__', '**')
			expect(result).toContain('`__not_bold__`')
			expect(result).toContain('**bold**')
		})
	})

	describe('EmphasisStyleRule Impact', () => {
		const convertEmphasisStyle = (text: string, ast: Root, fromStyle: '_' | '*', toStyle: '_' | '*'): string => {
			const replacer = new SafeTextReplacer(ast)
			if (fromStyle === '_' && toStyle === '*') {
				return replacer.safeReplace(text, /(?<!\w)_(?!_)([^_]+)_(?!_)/g, '*$1*')
			} else if (fromStyle === '*' && toStyle === '_') {
				return replacer.safeReplace(text, /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '_$1_')
			}
			return text
		}

		it('should convert _ to * without breaking math formula', async () => {
			const input = '_italic with $x_i$ formula_'
			const ast = await parser.parse(input)
			const result = convertEmphasisStyle(input, ast, '_', '*')
			expect(result).toContain('$x_i$')
		})

		it('should NOT modify WikiLink with underscores', async () => {
			const input = 'See [[Note_with_underscore]] and _italic_'
			const ast = await parser.parse(input)
			const result = convertEmphasisStyle(input, ast, '_', '*')
			expect(result).toContain('[[Note_with_underscore]]')
			expect(result).toContain('*italic*')
		})

		it('should NOT modify code blocks', async () => {
			const input = `_italic text_

\`\`\`python
x = "_not_italic_"
\`\`\``
			const ast = await parser.parse(input)
			const result = convertEmphasisStyle(input, ast, '_', '*')
			expect(result).toContain('x = "_not_italic_"')
			expect(result).toContain('*italic text*')
		})

		it('should NOT modify math blocks', async () => {
			const input = `_italic text_

$$
x_i = y_i
$$`
			const ast = await parser.parse(input)
			const result = convertEmphasisStyle(input, ast, '_', '*')
			expect(result).toContain('x_i = y_i')
			expect(result).toContain('*italic text*')
		})
	})

	describe('ProperEllipsisRule Impact', () => {
		const convertEllipsis = (text: string, ast: Root): string => {
			const replacer = new SafeTextReplacer(ast)
			return replacer.safeReplace(text, /\.\.\./g, '…')
		}

		it('should convert ... to … in normal text', async () => {
			const input = 'Text with ellipsis...'
			const ast = await parser.parse(input)
			const result = convertEllipsis(input, ast)
			expect(result).toBe('Text with ellipsis…')
		})

		it('should NOT modify code blocks', async () => {
			const input = `Text...

\`\`\`javascript
const x = "hello...world";
\`\`\``
			const ast = await parser.parse(input)
			const result = convertEllipsis(input, ast)
			expect(result).toContain('const x = "hello...world"')
			expect(result).toContain('Text…')
		})

		it('should NOT modify inline code', async () => {
			const input = 'Text... and `code...here`'
			const ast = await parser.parse(input)
			const result = convertEllipsis(input, ast)
			expect(result).toContain('Text…')
			expect(result).toContain('`code...here`')
		})

		it('should NOT modify WikiLink', async () => {
			const input = 'See [[Note...with...dots]] and text...'
			const ast = await parser.parse(input)
			const result = convertEllipsis(input, ast)
			expect(result).toContain('[[Note...with...dots]]')
			expect(result).toContain('text…')
		})

		it('should NOT modify math formula', async () => {
			const input = 'Formula $x...y$ and text...'
			const ast = await parser.parse(input)
			const result = convertEllipsis(input, ast)
			expect(result).toContain('$x...y$')
			expect(result).toContain('text…')
		})
	})

	describe('TrailingSpacesRule Impact', () => {
		const removeTrailingSpaces = (text: string, ast: Root): string => {
			const replacer = new SafeTextReplacer(ast)
			const lines = text.split('\n')
			const result: string[] = []
			
			for (let i = 0; i < lines.length; i++) {
				const lineNumber = i + 1
				if (replacer.isLineExcluded(lineNumber)) {
					result.push(lines[i])
				} else {
					result.push(lines[i].replace(/[ \t]+$/, ''))
				}
			}
			
			return result.join('\n')
		}

		it('should remove trailing spaces in normal text', async () => {
			const input = 'Line with trailing spaces   \nNormal line'
			const ast = await parser.parse(input)
			const result = removeTrailingSpaces(input, ast)
			expect(result).toBe('Line with trailing spaces\nNormal line')
		})

		it('should NOT modify code blocks content', async () => {
			const input = `Text   \n\`\`\`\ncode with spaces   \n\`\`\`\nMore text   `
			const ast = await parser.parse(input)
			const result = removeTrailingSpaces(input, ast)
			expect(result).toContain('code with spaces   ')
			expect(result).toContain('Text')
			expect(result).toContain('More text')
		})

		it('should NOT modify inline code', async () => {
			const input = 'Text with `code   ` and trailing   '
			const ast = await parser.parse(input)
			const result = removeTrailingSpaces(input, ast)
			expect(result).toContain('`code   `')
		})
	})

	describe('RemoveMultipleSpacesRule Impact', () => {
		const removeMultipleSpaces = (text: string, ast: Root): string => {
			const replacer = new SafeTextReplacer(ast)
			return replacer.safeReplace(text, / {2,}/g, ' ')
		}

		it('should remove multiple spaces in normal text', async () => {
			const input = 'Text with  multiple   spaces'
			const ast = await parser.parse(input)
			const result = removeMultipleSpaces(input, ast)
			expect(result).toBe('Text with multiple spaces')
		})

		it('should NOT modify code blocks', async () => {
			const input = `Text  here

\`\`\`python
x = "hello  world"
\`\`\``
			const ast = await parser.parse(input)
			const result = removeMultipleSpaces(input, ast)
			expect(result).toContain('x = "hello  world"')
			expect(result).toContain('Text here')
		})

		it('should NOT modify inline code', async () => {
			const input = 'Text  here and `code  here`'
			const ast = await parser.parse(input)
			const result = removeMultipleSpaces(input, ast)
			expect(result).toContain('`code  here`')
			expect(result).toContain('Text here')
		})

		it('should NOT modify math formula', async () => {
			const input = 'Formula $x  +  y$ and text  here'
			const ast = await parser.parse(input)
			const result = removeMultipleSpaces(input, ast)
			expect(result).toContain('$x  +  y$')
			expect(result).toContain('text here')
		})

		it('should NOT modify links', async () => {
			const input = 'Link [text](url  with  spaces) and text  here'
			const ast = await parser.parse(input)
			const result = removeMultipleSpaces(input, ast)
			expect(result).toContain('url  with  spaces')
			expect(result).toContain('text here')
		})
	})

	describe('SpaceAfterListMarkersRule Impact', () => {
		const fixListMarkerSpace = (text: string, ast: Root): string => {
			const replacer = new SafeTextReplacer(ast)
			const lines = text.split('\n')
			const result: string[] = []
			
			for (let i = 0; i < lines.length; i++) {
				const lineNumber = i + 1
				if (replacer.isLineExcluded(lineNumber)) {
					result.push(lines[i])
				} else {
					result.push(lines[i].replace(/^(?!(\s*)([-*+]{3,}|_{3,})(\s*$))(\s*)([-*+]|\d+[.)])(\S)/, '$4$5 $6'))
				}
			}
			
			return result.join('\n')
		}

		it('should add space after list marker', async () => {
			const input = '-item'
			const ast = await parser.parse(input)
			const result = fixListMarkerSpace(input, ast)
			expect(result).toBe('- item')
		})

		it('should NOT modify code blocks', async () => {
			const input = `- item

\`\`\`markdown
-nested item
\`\`\``
			const ast = await parser.parse(input)
			const result = fixListMarkerSpace(input, ast)
			expect(result).toContain('-nested item')
		})

		it('should NOT modify WikiLink in list', async () => {
			const input = '-[[Note|Alias]]'
			const ast = await parser.parse(input)
			const result = fixListMarkerSpace(input, ast)
			expect(result).toContain('[[Note|Alias]]')
		})
	})

	describe('Complex Nested Structures', () => {
		it('should handle bold containing WikiLink with pipe', async () => {
			const input = '**See [[Note|Display Name]] for details**'
			const ast = await parser.parse(input)
			
			const replacer = new SafeTextReplacer(ast)
			const result = replacer.safeReplace(input, /\*\*/g, '__')
			
			expect(result).toBe('__See [[Note|Display Name]] for details__')
		})

		it('should handle italic containing math', async () => {
			const input = '*Formula: $x_i$ is important*'
			const ast = await parser.parse(input)
			
			const replacer = new SafeTextReplacer(ast)
			const result = replacer.safeReplace(input, /\*/g, '_')
			
			expect(result).toBe('_Formula: $x_i$ is important_')
		})

		it('should handle highlight containing WikiLink', async () => {
			const input = '==Important: [[Note]]=='
			const ast = await parser.parse(input)
			
			const replacer = new SafeTextReplacer(ast)
			const result = replacer.safeReplace(input, /==/g, '**')
			
			expect(result).toBe('**Important: [[Note]]**')
		})

		it('should handle callout with WikiLink', async () => {
			const input = `> [!note] Note
> Content with [[Link|Alias]]`
			const ast = await parser.parse(input)
			
			const replacer = new SafeTextReplacer(ast)
			const result = replacer.safeReplace(input, /\|/g, '-')
			
			expect(result).toContain('[[Link|Alias]]')
		})

		it('should handle multiple special syntaxes in one document', async () => {
			const input = `---
title: Test
---

# Heading

Text with **bold** and [[WikiLink|Alias]].

\`\`\`javascript
const x = "**not_bold**";
\`\`\`

Math: $x_i + y_j$

- List item with [[Link]]
- Another item

==highlighted text==

%%comment%%`
			const ast = await parser.parse(input)
			
			const replacer = new SafeTextReplacer(ast)
			const result = replacer.safeReplace(input, /\*\*/g, '__')
			
			expect(result).toContain('__bold__')
			expect(result).toContain('[[WikiLink|Alias]]')
			expect(result).toContain('const x = "**not_bold**"')
			expect(result).toContain('$x_i + y_j$')
			expect(result).toContain('[[Link]]')
			expect(result).toContain('==highlighted text==')
			expect(result).toContain('%%comment%%')
		})
	})

	describe('ASTSafeExecutor Integration', () => {
		it('should work with ASTSafeExecutor for safe fixes', async () => {
			const input = 'Text... and `code...here`'
			const ast = await parser.parse(input)
			const context = createMockContext(input, ast)
			
			const executor = new ASTSafeExecutor()
			const modified = executor.executeSafeFix(context, (text, isLineExcluded) => {
				const lines = text.split('\n')
				return lines.map((line, i) => {
					if (isLineExcluded(i + 1)) {
						return line
					}
					return line.replace(/\.\.\./g, '…')
				}).join('\n')
			})
			
			expect(modified).toBe(true)
			expect(context.body).toContain('Text…')
			expect(context.body).toContain('`code...here`')
		})
	})
})
