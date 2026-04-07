import { SafeTextReplacer, ExcludedRegion } from '../../utils/SafeTextReplacer'
import type { Root, Node, Position } from 'mdast'

function createMockAST(regions: ExcludedRegion[]): Root {
	const children: any[] = []
	
	for (const region of regions) {
		const node: any = {
			type: region.type,
			position: {
				start: { line: region.startLine, column: 1 },
				end: { line: region.endLine, column: 100 }
			}
		}
		children.push(node)
	}
	
	return {
		type: 'root',
		children
	}
}

class UnsafeTextReplacer {
	safeReplace(text: string, pattern: RegExp, replacement: string): string {
		return text.replace(pattern, replacement)
	}
}

describe('SafeTextReplacer Core Tests', () => {
	describe('Exclusion Detection', () => {
		it('should detect code blocks', () => {
			const ast = createMockAST([
				{ type: 'code', startLine: 1, endLine: 3 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			expect(replacer.isLineExcluded(1)).toBe(true)
			expect(replacer.isLineExcluded(2)).toBe(true)
			expect(replacer.isLineExcluded(3)).toBe(true)
			expect(replacer.isLineExcluded(4)).toBe(false)
		})

		it('should detect inline code', () => {
			const ast = createMockAST([
				{ type: 'inlineCode', startLine: 1, endLine: 1 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			expect(replacer.isLineExcluded(1)).toBe(true)
			expect(replacer.isLineExcluded(2)).toBe(false)
		})

		it('should detect math blocks', () => {
			const ast = createMockAST([
				{ type: 'math', startLine: 2, endLine: 4 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			expect(replacer.isLineExcluded(1)).toBe(false)
			expect(replacer.isLineExcluded(2)).toBe(true)
			expect(replacer.isLineExcluded(3)).toBe(true)
			expect(replacer.isLineExcluded(4)).toBe(true)
			expect(replacer.isLineExcluded(5)).toBe(false)
		})

		it('should detect links', () => {
			const ast = createMockAST([
				{ type: 'link', startLine: 1, endLine: 1 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			expect(replacer.isLineExcluded(1)).toBe(true)
		})

		it('should detect strong/emphasis', () => {
			const ast = createMockAST([
				{ type: 'strong', startLine: 1, endLine: 1 },
				{ type: 'emphasis', startLine: 2, endLine: 2 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			expect(replacer.isLineExcluded(1)).toBe(true)
			expect(replacer.isLineExcluded(2)).toBe(true)
		})

		it('should detect multiple regions', () => {
			const ast = createMockAST([
				{ type: 'code', startLine: 1, endLine: 3 },
				{ type: 'inlineCode', startLine: 5, endLine: 5 },
				{ type: 'link', startLine: 7, endLine: 7 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			expect(replacer.isLineExcluded(1)).toBe(true)
			expect(replacer.isLineExcluded(2)).toBe(true)
			expect(replacer.isLineExcluded(3)).toBe(true)
			expect(replacer.isLineExcluded(4)).toBe(false)
			expect(replacer.isLineExcluded(5)).toBe(true)
			expect(replacer.isLineExcluded(6)).toBe(false)
			expect(replacer.isLineExcluded(7)).toBe(true)
		})
	})

	describe('Safe Replace - Code Exclusion', () => {
		it('should NOT modify content inside code blocks', () => {
			const ast = createMockAST([
				{ type: 'code', startLine: 2, endLine: 4 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			const input = `Text before...

\`\`\`javascript
const x = "hello...world";
\`\`\`

Text after...`
			
			const result = replacer.safeReplace(input, /\.\.\./g, '…')
			
			expect(result).toContain('Text before…')
			expect(result).toContain('const x = "hello...world"')
			expect(result).toContain('Text after…')
		})

		it('SHOULD modify content inside code blocks with unsafe replacer', () => {
			const unsafeReplacer = new UnsafeTextReplacer()
			
			const input = `Text before...

\`\`\`javascript
const x = "hello...world";
\`\`\`

Text after...`
			
			const result = unsafeReplacer.safeReplace(input, /\.\.\./g, '…')
			
			expect(result).toContain('Text before…')
			expect(result).toContain('const x = "hello…world"')
			expect(result).toContain('Text after…')
		})

		it('should NOT modify lines containing inline code', () => {
			const ast = createMockAST([
				{ type: 'inlineCode', startLine: 1, endLine: 1 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			const input = 'Text with `code...here`'
			const result = replacer.safeReplace(input, /\.\.\./g, '…')
			
			expect(result).toBe('Text with `code...here`')
		})

		it('SHOULD modify content inside inline code with unsafe replacer', () => {
			const unsafeReplacer = new UnsafeTextReplacer()
			
			const input = 'Text with `code...here` and normal...'
			const result = unsafeReplacer.safeReplace(input, /\.\.\./g, '…')
			
			expect(result).toBe('Text with `code…here` and normal…')
		})
	})

	describe('Safe Replace - Math Exclusion', () => {
		it('should NOT modify lines containing math', () => {
			const ast = createMockAST([
				{ type: 'math', startLine: 1, endLine: 1 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			const input = 'Formula $x_1  +  x_2$'
			const result = replacer.safeReplace(input, / {2,}/g, ' ')
			
			expect(result).toBe('Formula $x_1  +  x_2$')
		})

		it('SHOULD modify content inside math blocks with unsafe replacer', () => {
			const unsafeReplacer = new UnsafeTextReplacer()
			
			const input = 'Formula $x_1  +  x_2$ and text  here'
			const result = unsafeReplacer.safeReplace(input, / {2,}/g, ' ')
			
			expect(result).toContain('$x_1 + x_2$')
			expect(result).toContain('text here')
		})
	})

	describe('Safe Replace - Link Exclusion', () => {
		it('should NOT modify URL inside links', () => {
			const ast = createMockAST([
				{ type: 'link', startLine: 1, endLine: 1 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			const input = 'Check [link](https://example.com/path  with  spaces) here'
			const result = replacer.safeReplace(input, / {2,}/g, ' ')
			
			expect(result).toContain('https://example.com/path  with  spaces')
		})

		it('SHOULD modify URL inside links with unsafe replacer', () => {
			const unsafeReplacer = new UnsafeTextReplacer()
			
			const input = 'Check [link](https://example.com/path  with  spaces) here'
			const result = unsafeReplacer.safeReplace(input, / {2,}/g, ' ')
			
			expect(result).toContain('https://example.com/path with spaces')
		})
	})

	describe('Safe Replace - Strong/Emphasis Exclusion', () => {
		it('should NOT modify lines containing strong', () => {
			const ast = createMockAST([
				{ type: 'strong', startLine: 1, endLine: 1 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			const input = '**bold  text**'
			const result = replacer.safeReplace(input, / {2,}/g, ' ')
			
			expect(result).toBe('**bold  text**')
		})

		it('should NOT modify lines containing emphasis', () => {
			const ast = createMockAST([
				{ type: 'emphasis', startLine: 1, endLine: 1 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			const input = '*italic  text*'
			const result = replacer.safeReplace(input, / {2,}/g, ' ')
			
			expect(result).toBe('*italic  text*')
		})
	})

	describe('Safe Replace - Image Exclusion', () => {
		it('should NOT modify lines containing images', () => {
			const ast = createMockAST([
				{ type: 'image', startLine: 1, endLine: 1 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			const input = '![alt text](image  url)'
			const result = replacer.safeReplace(input, / {2,}/g, ' ')
			
			expect(result).toBe('![alt text](image  url)')
		})
	})

	describe('Safe Replace - HTML Exclusion', () => {
		it('should NOT modify lines containing HTML', () => {
			const ast = createMockAST([
				{ type: 'html', startLine: 1, endLine: 1 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			const input = '<div  class="test">content</div>'
			const result = replacer.safeReplace(input, / {2,}/g, ' ')
			
			expect(result).toBe('<div  class="test">content</div>')
		})
	})

	describe('Edge Cases', () => {
		it('should handle empty document', () => {
			const ast = createMockAST([])
			const replacer = new SafeTextReplacer(ast)
			
			const result = replacer.safeReplace('', /\.\.\./g, '…')
			expect(result).toBe('')
		})

		it('should handle document with no excluded regions', () => {
			const ast = createMockAST([])
			const replacer = new SafeTextReplacer(ast)
			
			const input = 'Text with ellipsis...'
			const result = replacer.safeReplace(input, /\.\.\./g, '…')
			
			expect(result).toBe('Text with ellipsis…')
		})

		it('should handle multiline content correctly', () => {
			const ast = createMockAST([
				{ type: 'code', startLine: 3, endLine: 5 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			const input = `Line 1...

\`\`\`
Code line 1...
Code line 2...
\`\`\`

Line 2...`
			
			const result = replacer.safeReplace(input, /\.\.\./g, '…')
			
			expect(result).toContain('Line 1…')
			expect(result).toContain('Code line 1...')
			expect(result).toContain('Code line 2...')
			expect(result).toContain('Line 2…')
		})

		it('should handle overlapping regions', () => {
			const ast = createMockAST([
				{ type: 'code', startLine: 1, endLine: 5 },
				{ type: 'inlineCode', startLine: 3, endLine: 3 }
			])
			const replacer = new SafeTextReplacer(ast)
			
			expect(replacer.isLineExcluded(1)).toBe(true)
			expect(replacer.isLineExcluded(2)).toBe(true)
			expect(replacer.isLineExcluded(3)).toBe(true)
			expect(replacer.isLineExcluded(4)).toBe(true)
			expect(replacer.isLineExcluded(5)).toBe(true)
			expect(replacer.isLineExcluded(6)).toBe(false)
		})
	})

	describe('Comparison: Safe vs Unsafe', () => {
		it('demonstrates the difference between safe and unsafe replacement', () => {
			const ast = createMockAST([
				{ type: 'code', startLine: 3, endLine: 5 }
			])
			const safeReplacer = new SafeTextReplacer(ast)
			const unsafeReplacer = new UnsafeTextReplacer()
			
			const input = `Normal text...

\`\`\`javascript
const x = "code...here";
\`\`\`

More text...`
			
			const safeResult = safeReplacer.safeReplace(input, /\.\.\./g, '…')
			const unsafeResult = unsafeReplacer.safeReplace(input, /\.\.\./g, '…')
			
			expect(safeResult).toContain('const x = "code...here"')
			expect(unsafeResult).toContain('const x = "code…here"')
			
			expect(safeResult).toContain('Normal text…')
			expect(unsafeResult).toContain('Normal text…')
		})
	})
})

describe('Exclusion Strategy Analysis', () => {
	it('proves code blocks MUST be excluded', () => {
		const ast = createMockAST([
			{ type: 'code', startLine: 1, endLine: 3 }
		])
		const safeReplacer = new SafeTextReplacer(ast)
		const unsafeReplacer = new UnsafeTextReplacer()
		
		const input = `\`\`\`javascript
const regex = /.../g;
\`\`\``
		
		const safeResult = safeReplacer.safeReplace(input, /\.\.\./g, '…')
		const unsafeResult = unsafeReplacer.safeReplace(input, /\.\.\./g, '…')
		
		expect(safeResult).toContain('/.../g')
		expect(unsafeResult).toContain('/…/g')
		
		expect(safeResult).not.toBe(unsafeResult)
	})

	it('proves inline code MUST be excluded', () => {
		const ast = createMockAST([
			{ type: 'inlineCode', startLine: 1, endLine: 1 }
		])
		const safeReplacer = new SafeTextReplacer(ast)
		const unsafeReplacer = new UnsafeTextReplacer()
		
		const input = 'Use `const x = ...` for example'
		
		const safeResult = safeReplacer.safeReplace(input, /\.\.\./g, '…')
		const unsafeResult = unsafeReplacer.safeReplace(input, /\.\.\./g, '…')
		
		expect(safeResult).toContain('`const x = ...`')
		expect(unsafeResult).toContain('`const x = …`')
		
		expect(safeResult).not.toBe(unsafeResult)
	})

	it('proves math MUST be excluded', () => {
		const ast = createMockAST([
			{ type: 'math', startLine: 1, endLine: 1 }
		])
		const safeReplacer = new SafeTextReplacer(ast)
		const unsafeReplacer = new UnsafeTextReplacer()
		
		const input = 'Formula: $x_1 + x_2$'
		
		const safeResult = safeReplacer.safeReplace(input, /_/g, '-')
		const unsafeResult = unsafeReplacer.safeReplace(input, /_/g, '-')
		
		expect(safeResult).toContain('$x_1 + x_2$')
		expect(unsafeResult).toContain('$x-1 + x-2$')
		
		expect(safeResult).not.toBe(unsafeResult)
	})

	it('proves links MUST be excluded', () => {
		const ast = createMockAST([
			{ type: 'link', startLine: 1, endLine: 1 }
		])
		const safeReplacer = new SafeTextReplacer(ast)
		const unsafeReplacer = new UnsafeTextReplacer()
		
		const input = 'Check [link](https://example.com/path  with  spaces)'
		
		const safeResult = safeReplacer.safeReplace(input, / {2,}/g, ' ')
		const unsafeResult = unsafeReplacer.safeReplace(input, / {2,}/g, ' ')
		
		expect(safeResult).toContain('path  with  spaces')
		expect(unsafeResult).toContain('path with spaces')
		
		expect(safeResult).not.toBe(unsafeResult)
	})

	it('analyzes if strong/emphasis needs exclusion', () => {
		const ast = createMockAST([
			{ type: 'strong', startLine: 1, endLine: 1 }
		])
		const safeReplacer = new SafeTextReplacer(ast)
		const unsafeReplacer = new UnsafeTextReplacer()
		
		const input = '**bold  text**'
		
		const safeResult = safeReplacer.safeReplace(input, / {2,}/g, ' ')
		const unsafeResult = unsafeReplacer.safeReplace(input, / {2,}/g, ' ')
		
		expect(safeResult).toBe('**bold  text**')
		expect(unsafeResult).toBe('**bold text**')
		
		expect(safeResult).not.toBe(unsafeResult)
	})
})
