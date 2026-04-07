import { ObsidianParser } from '../ObsidianParser'
import { SafeTextReplacer, ExcludedRegion } from '../../utils/SafeTextReplacer'
import type { Root } from 'mdast'

class UnsafeTextReplacer {
	safeReplace(text: string, pattern: RegExp, replacement: string): string {
		return text.replace(pattern, replacement)
	}
}

class PartialSafeTextReplacer extends SafeTextReplacer {
	private excludeTypes: Set<string>

	constructor(ast: Root, excludeTypes: string[] = []) {
		super(ast)
		this.excludeTypes = new Set(excludeTypes)
	}

	isLineExcluded(lineNumber: number): boolean {
		const regions = this.getExcludedRegions()
		return regions.some(region => {
			if (!this.excludeTypes.has(region.type)) {
				return false
			}
			return lineNumber >= region.startLine && lineNumber <= region.endLine
		})
	}
}

describe('SafeTextReplacer Exclusion Strategy', () => {
	const parser = new ObsidianParser()

	describe('Parser Round-trip Tests', () => {
		const testCases = [
			{ name: 'WikiLink basic', input: '[[Note]]' },
			{ name: 'WikiLink with alias', input: '[[Note|Alias]]' },
			{ name: 'WikiLink with heading', input: '[[Note#Section]]' },
			{ name: 'WikiLink with block id', input: '[[Note#^block123]]' },
			{ name: 'Embed basic', input: '![[image.png]]' },
			{ name: 'Embed with dimensions', input: '![[image.png|200x300]]' },
			{ name: 'Tag basic', input: '#tag' },
			{ name: 'Tag nested', input: '#nested/tag' },
			{ name: 'Highlight', input: '==highlighted text==' },
			{ name: 'Comment', input: '%%comment%%' },
			{ name: 'Inline math', input: '$E = mc^2$' },
			{ name: 'Block math', input: '$$\nE = mc^2\n$$' },
			{ name: 'Strong with **', input: '**bold text**' },
			{ name: 'Strong with __', input: '__bold text__' },
			{ name: 'Emphasis with *', input: '*italic text*' },
			{ name: 'Emphasis with _', input: '_italic text_' },
			{ name: 'Inline code', input: '`code`' },
			{ name: 'Link', input: '[text](https://example.com)' },
		]

		testCases.forEach(({ name, input }) => {
			it(`should round-trip: ${name}`, async () => {
				const ast = await parser.parse(input)
				const output = await parser.stringify(ast)
				expect(output.trim()).toBe(input)
			})
		})
	})

	describe('Strong/Emphasis Exclusion Impact', () => {
		it('should NOT break WikiLink when converting __ to ** (unsafe)', async () => {
			const input = '__bold with [[Note|Alias]] inside__'
			const ast = await parser.parse(input)
			
			const unsafeReplacer = new UnsafeTextReplacer()
			const result = unsafeReplacer.safeReplace(
				input,
				/__(.+?)__/g,
				'**$1**'
			)
			
			expect(result).toBe('**bold with [[Note|Alias]] inside**')
			expect(result).toContain('[[Note|Alias]]')
		})

		it('should NOT break WikiLink when converting __ to ** (safe)', async () => {
			const input = '__bold with [[Note|Alias]] inside__'
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/__(.+?)__/g,
				'**$1**'
			)
			
			expect(result).toBe('**bold with [[Note|Alias]] inside**')
			expect(result).toContain('[[Note|Alias]]')
		})

		it('should NOT break math formula when converting _ to * (unsafe)', async () => {
			const input = '_italic with $x_i$ formula_'
			const ast = await parser.parse(input)
			
			const unsafeReplacer = new UnsafeTextReplacer()
			const result = unsafeReplacer.safeReplace(
				input,
				/_(.+?)_/g,
				'*$1*'
			)
			
			expect(result).toContain('$x_i$')
		})

		it('should NOT break math formula when converting _ to * (safe)', async () => {
			const input = '_italic with $x_i$ formula_'
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/_(.+?)_/g,
				'*$1*'
			)
			
			expect(result).toContain('$x_i$')
		})

		it('should correctly handle WikiLink with underscore in filename', async () => {
			const input = '[[Note_with_underscore]]'
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/_/g,
				'-'
			)
			
			expect(result).toBe('[[Note_with_underscore]]')
		})

		it('should correctly handle WikiLink with asterisk in filename', async () => {
			const input = '[[Note*special]]'
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/\*/g,
				''
			)
			
			expect(result).toBe('[[Note*special]]')
		})
	})

	describe('Code/Math Exclusion Impact', () => {
		it('should NOT modify content inside inline code (safe)', async () => {
			const input = 'Text with `code...here` and normal...'
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/\.\.\./g,
				'…'
			)
			
			expect(result).toBe('Text with `code...here` and normal…')
		})

		it('SHOULD modify content inside inline code (unsafe)', async () => {
			const input = 'Text with `code...here` and normal...'
			
			const unsafeReplacer = new UnsafeTextReplacer()
			const result = unsafeReplacer.safeReplace(
				input,
				/\.\.\./g,
				'…'
			)
			
			expect(result).toBe('Text with `code…here` and normal…')
		})

		it('should NOT modify content inside code block (safe)', async () => {
			const input = `Text before

\`\`\`javascript
const x = "hello...world";
\`\`\`

Text after...`
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/\.\.\./g,
				'…'
			)
			
			expect(result).toContain('const x = "hello...world"')
			expect(result).toContain('Text after…')
		})

		it('SHOULD modify content inside code block (unsafe)', async () => {
			const input = `Text before

\`\`\`javascript
const x = "hello...world";
\`\`\`

Text after...`
			
			const unsafeReplacer = new UnsafeTextReplacer()
			const result = unsafeReplacer.safeReplace(
				input,
				/\.\.\./g,
				'…'
			)
			
			expect(result).toContain('const x = "hello…world"')
		})

		it('should NOT modify content inside math formula (safe)', async () => {
			const input = 'Formula $x_1 + x_2$ and text with spaces  here'
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/ {2,}/g,
				' '
			)
			
			expect(result).toContain('$x_1 + x_2$')
			expect(result).toContain('text with spaces here')
		})

		it('SHOULD modify content inside math formula (unsafe)', async () => {
			const input = 'Formula $x_1  +  x_2$ and text with spaces  here'
			
			const unsafeReplacer = new UnsafeTextReplacer()
			const result = unsafeReplacer.safeReplace(
				input,
				/ {2,}/g,
				' '
			)
			
			expect(result).toContain('$x_1 + x_2$')
		})
	})

	describe('Link Exclusion Impact', () => {
		it('should NOT modify URL inside link (safe)', async () => {
			const input = 'Check [link](https://example.com/path  with  spaces) here'
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/ {2,}/g,
				' '
			)
			
			expect(result).toContain('https://example.com/path  with  spaces')
		})

		it('SHOULD modify URL inside link (unsafe)', async () => {
			const input = 'Check [link](https://example.com/path  with  spaces) here'
			
			const unsafeReplacer = new UnsafeTextReplacer()
			const result = unsafeReplacer.safeReplace(
				input,
				/ {2,}/g,
				' '
			)
			
			expect(result).toContain('https://example.com/path with spaces')
		})
	})

	describe('Partial Exclusion Tests', () => {
		it('should work correctly when NOT excluding strong/emphasis', async () => {
			const input = '**bold** and __bold__ with [[Note|Alias]]'
			const ast = await parser.parse(input)
			
			const partialReplacer = new PartialSafeTextReplacer(ast, ['code', 'math', 'link', 'inlineCode'])
			const result = partialReplacer.safeReplace(
				input,
				/__(.+?)__/g,
				'**$1**'
			)
			
			expect(result).toBe('**bold** and **bold** with [[Note|Alias]]')
		})

		it('should still protect code when only excluding code', async () => {
			const input = '`code...here` and normal...'
			const ast = await parser.parse(input)
			
			const partialReplacer = new PartialSafeTextReplacer(ast, ['code', 'inlineCode'])
			const result = partialReplacer.safeReplace(
				input,
				/\.\.\./g,
				'…'
			)
			
			expect(result).toBe('`code...here` and normal…')
		})

		it('should still protect math when only excluding math', async () => {
			const input = '$x_1  +  x_2$ and text  here'
			const ast = await parser.parse(input)
			
			const partialReplacer = new PartialSafeTextReplacer(ast, ['math'])
			const result = partialReplacer.safeReplace(
				input,
				/ {2,}/g,
				' '
			)
			
			expect(result).toContain('$x_1  +  x_2$')
			expect(result).toContain('text here')
		})
	})

	describe('Nested Structure Tests', () => {
		it('should handle bold with WikiLink inside', async () => {
			const input = '**bold with [[Note|Alias]] inside**'
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/\*\*/g,
				'__'
			)
			
			expect(result).toBe('__bold with [[Note|Alias]] inside__')
		})

		it('should handle WikiLink with bold in alias', async () => {
			const input = '[[Note|**Alias**]]'
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/\*\*/g,
				'__'
			)
			
			expect(result).toBe('[[Note|**Alias**]]')
		})

		it('should handle highlight with WikiLink inside', async () => {
			const input = '==highlight with [[Note]] inside=='
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/==/g,
				'**'
			)
			
			expect(result).toBe('**highlight with [[Note]] inside**')
		})
	})

	describe('Edge Cases', () => {
		it('should handle empty document', async () => {
			const input = ''
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/\.\.\./g,
				'…'
			)
			
			expect(result).toBe('')
		})

		it('should handle document with only excluded content', async () => {
			const input = '```\ncode block\n```'
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/./g,
				'x'
			)
			
			expect(result).toBe(input)
		})

		it('should handle multiline content correctly', async () => {
			const input = `Line 1...

\`\`\`
Code line 1...
Code line 2...
\`\`\`

Line 2...`
			const ast = await parser.parse(input)
			
			const safeReplacer = new SafeTextReplacer(ast)
			const result = safeReplacer.safeReplace(
				input,
				/\.\.\./g,
				'…'
			)
			
			expect(result).toContain('Line 1…')
			expect(result).toContain('Code line 1...')
			expect(result).toContain('Line 2…')
		})
	})
})
