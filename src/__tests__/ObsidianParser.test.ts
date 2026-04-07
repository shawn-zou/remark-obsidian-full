import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ObsidianParser, createParser, type ParserConfig } from '../ObsidianParser'
import type { Root, Node } from 'mdast'

describe('ObsidianParser', () => {
	describe('constructor', () => {
		it('should create parser with default config', () => {
			const parser = new ObsidianParser()
			expect(parser).toBeInstanceOf(ObsidianParser)
		})

		it('should create parser with custom config', () => {
			const config: ParserConfig = {
				syntax: {
					wikiLink: true,
					embed: true
				}
			}
			const parser = new ObsidianParser(config)
			expect(parser).toBeInstanceOf(ObsidianParser)
		})
	})

	describe('createParser', () => {
		it('should create parser instance', () => {
			const parser = createParser()
			expect(parser).toBeInstanceOf(ObsidianParser)
		})

		it('should create parser with config', () => {
			const parser = createParser({ syntax: { tag: true } })
			expect(parser).toBeInstanceOf(ObsidianParser)
		})
	})

	describe('parse', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should parse basic text', async () => {
			const ast = await parser.parse('hello')
			expect(ast.type).toBe('root')
			expect(ast.children.length).toBeGreaterThan(0)
		})

		it('should parse heading', async () => {
			const ast = await parser.parse('# Title')
			expect(ast.children[0].type).toBe('heading')
		})

		it('should parse paragraph', async () => {
			const ast = await parser.parse('Some text')
			expect(ast.children[0].type).toBe('paragraph')
		})

		it('should parse wiki link', async () => {
			const ast = await parser.parse('[[link]]')
			const wikiLinks = parser.findNodesByType(ast, 'wikiLink')
			expect(wikiLinks.length).toBe(1)
		})

		it('should parse tag', async () => {
			const ast = await parser.parse('#tag')
			const tags = parser.findNodesByType(ast, 'tag')
			expect(tags.length).toBe(1)
		})

		it('should parse embed', async () => {
			const ast = await parser.parse('![[image.png]]')
			const embeds = parser.findNodesByType(ast, 'embed')
			expect(embeds.length).toBe(1)
		})

		it('should parse highlight', async () => {
			const ast = await parser.parse('==highlighted==')
			const highlights = parser.findNodesByType(ast, 'highlight')
			expect(highlights.length).toBe(1)
		})

		it('should parse comment', async () => {
			const ast = await parser.parse('%%comment%%')
			const comments = parser.findNodesByType(ast, 'comment')
			expect(comments.length).toBe(1)
		})

		it('should parse math', async () => {
			const ast = await parser.parse('$x^2$')
			const math = parser.findNodesByType(ast, 'math')
			expect(math.length).toBe(1)
		})

		it('should parse empty document', async () => {
			const ast = await parser.parse('')
			expect(ast.type).toBe('root')
			expect(ast.children.length).toBe(0)
		})

		it('should parse multiple wiki links', async () => {
			const ast = await parser.parse('[[link1]] and [[link2]] and [[link3]]')
			const wikiLinks = parser.findNodesByType(ast, 'wikiLink')
			expect(wikiLinks.length).toBe(3)
		})
	})

	describe('stringify', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should stringify AST to markdown', async () => {
			const ast = await parser.parse('# Title')
			const output = await parser.stringify(ast)
			expect(output).toContain('# Title')
		})

		it('should round-trip basic content', async () => {
			const input = '[[link]] and #tag'
			const ast = await parser.parse(input)
			const output = await parser.stringify(ast)
			expect(output.trim()).toBe(input)
		})

		it('should round-trip wiki link with alias', async () => {
			const input = '[[Note|Display]]'
			const ast = await parser.parse(input)
			const output = await parser.stringify(ast)
			expect(output.trim()).toBe(input)
		})

		it('should round-trip highlight', async () => {
			const input = '==highlighted=='
			const ast = await parser.parse(input)
			const output = await parser.stringify(ast)
			expect(output.trim()).toBe(input)
		})
	})

	describe('findNodesByType', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should find nodes by single type', async () => {
			const ast = await parser.parse('[[link1]] text [[link2]]')
			const links = parser.findNodesByType(ast, 'wikiLink')
			expect(links.length).toBe(2)
		})

		it('should find nodes by multiple types', async () => {
			const ast = await parser.parse('[[link]] #tag ==highlight==')
			const nodes = parser.findNodesByType(ast, ['wikiLink', 'tag', 'highlight'])
			expect(nodes.length).toBe(3)
		})

		it('should return empty array for non-existent type', async () => {
			const ast = await parser.parse('text')
			const nodes = parser.findNodesByType(ast, 'nonExistent')
			expect(nodes.length).toBe(0)
		})
	})

	describe('query', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should query nodes by type', async () => {
			const ast = await parser.parse('[[link1]] [[link2]]')
			const links = parser.query(ast, { type: 'wikiLink' })
			expect(links.length).toBe(2)
		})

		it('should query nodes with filter', async () => {
			const ast = await parser.parse('[[short]] [[longer-name]]')
			const links = parser.query(ast, {
				type: 'wikiLink',
				filter: (node: Node) => {
					const literal = node as { value?: string }
					return (literal.value?.length ?? 0) > 5
				}
			})
			expect(links.length).toBe(1)
		})

		it('should query all nodes without type filter', async () => {
			const ast = await parser.parse('text')
			const nodes = parser.query(ast, {
				filter: (node: Node) => node.type === 'text'
			})
			expect(nodes.length).toBe(1)
		})
	})

	describe('visit', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should visit all nodes', async () => {
			const ast = await parser.parse('[[link]] #tag')
			const types: string[] = []
			parser.visit(ast, (node) => {
				types.push(node.type)
			})
			expect(types.length).toBeGreaterThan(0)
			expect(types).toContain('wikiLink')
			expect(types).toContain('tag')
		})

		it('should support early termination', async () => {
			const ast = await parser.parse('[[link]] #tag')
			const visited: string[] = []
			parser.visit(ast, (node) => {
				visited.push(node.type)
				if (node.type === 'wikiLink') {
					return false
				}
			})
			expect(visited).toContain('wikiLink')
		})
	})

	describe('visitByType', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should visit nodes of specific type', async () => {
			const ast = await parser.parse('[[link1]] #tag [[link2]]')
			const values: string[] = []
			parser.visitByType(ast, 'wikiLink', (node) => {
				const link = node as { value?: string }
				if (link.value) values.push(link.value)
			})
			expect(values.length).toBe(2)
			expect(values).toContain('link1')
			expect(values).toContain('link2')
		})

		it('should visit multiple types', async () => {
			const ast = await parser.parse('[[link]] #tag')
			const types: string[] = []
			parser.visitByType(ast, ['wikiLink', 'tag'], (node) => {
				types.push(node.type)
			})
			expect(types.length).toBe(2)
		})
	})

	describe('getNodeText', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should get text from literal node', async () => {
			const ast = await parser.parse('hello world')
			const textNode = ast.children[0].children?.[0] as { value?: string }
			const text = parser.getNodeText(textNode as Node)
			expect(text).toBe('hello world')
		})

		it('should get text from parent node', async () => {
			const ast = await parser.parse('**bold**')
			const paragraph = ast.children[0]
			const text = parser.getNodeText(paragraph as Node)
			expect(text).toBe('bold')
		})

		it('should handle nodes without value or children', async () => {
			const ast = await parser.parse('text')
			const text = parser.getNodeText(ast.children[0] as Node)
			expect(typeof text).toBe('string')
		})
	})

	describe('registerPlugin', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should register a plugin', () => {
			const plugin = {
				name: 'test-plugin',
				version: '1.0.0'
			}
			parser.registerPlugin(plugin)
			expect(parser.getPlugin('test-plugin')).toBe(plugin)
		})

		it('should re-create processors after plugin registration', () => {
			const plugin = {
				name: 'test-plugin',
				version: '1.0.0'
			}
			expect(() => parser.registerPlugin(plugin)).not.toThrow()
		})
	})

	describe('unregisterPlugin', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should unregister a plugin', () => {
			const plugin = {
				name: 'test-plugin',
				version: '1.0.0'
			}
			parser.registerPlugin(plugin)
			const result = parser.unregisterPlugin('test-plugin')
			expect(result).toBe(true)
			expect(parser.getPlugin('test-plugin')).toBeUndefined()
		})

		it('should return false for non-existent plugin', () => {
			const result = parser.unregisterPlugin('non-existent')
			expect(result).toBe(false)
		})
	})

	describe('getPlugin', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should return plugin by name', () => {
			const plugin = {
				name: 'my-plugin',
				version: '1.0.0'
			}
			parser.registerPlugin(plugin)
			expect(parser.getPlugin('my-plugin')).toBe(plugin)
		})

		it('should return undefined for non-existent plugin', () => {
			expect(parser.getPlugin('non-existent')).toBeUndefined()
		})
	})

	describe('dispose', () => {
		it('should dispose parser and clean up resources', () => {
			const parser = new ObsidianParser()
			parser.registerPlugin({
				name: 'test-plugin',
				version: '1.0.0',
				dispose: vi.fn()
			} as any)
			expect(() => parser.dispose()).not.toThrow()
		})
	})

	describe('hooks', () => {
		let parser: ObsidianParser

		beforeEach(() => {
			parser = new ObsidianParser()
		})

		it('should have hooks property', () => {
			expect(parser.hooks).toBeDefined()
		})

		it('should register beforeParse hook', () => {
			const fn = (text: string) => text
			expect(() => parser.hooks.beforeParse(fn)).not.toThrow()
		})

		it('should register afterParse hook', () => {
			const fn = (ast: Root) => ast
			expect(() => parser.hooks.afterParse(fn)).not.toThrow()
		})

		it('should register beforeStringify hook', () => {
			const fn = (ast: Root) => ast
			expect(() => parser.hooks.beforeStringify(fn)).not.toThrow()
		})

		it('should register afterStringify hook', () => {
			const fn = (text: string) => text
			expect(() => parser.hooks.afterStringify(fn)).not.toThrow()
		})

		it('should register onError hook', () => {
			const fn = (error: any) => {}
			expect(() => parser.hooks.onError(fn)).not.toThrow()
		})
	})
})

describe('Parser Configuration', () => {
	describe('config acceptance', () => {
		it('should accept wikiLink config', () => {
			const parser = new ObsidianParser({ 
				syntax: { wikiLink: { aliasDivider: '|' } } 
			})
			expect(parser).toBeInstanceOf(ObsidianParser)
		})

		it('should accept embed config', () => {
			const parser = new ObsidianParser({ 
				syntax: { embed: { aliasDivider: '|' } } 
			})
			expect(parser).toBeInstanceOf(ObsidianParser)
		})

		it('should accept tag config', () => {
			const parser = new ObsidianParser({ 
				syntax: { tag: { allowNested: true } } 
			})
			expect(parser).toBeInstanceOf(ObsidianParser)
		})

		it('should accept callout config', () => {
			const parser = new ObsidianParser({ 
				syntax: { callout: { types: ['note', 'tip'] } } 
			})
			expect(parser).toBeInstanceOf(ObsidianParser)
		})

		it('should accept math config', () => {
			const parser = new ObsidianParser({ 
				syntax: { math: { singleDollarTextMath: true } } 
			})
			expect(parser).toBeInstanceOf(ObsidianParser)
		})

		it('should accept stringify config and use bullet', async () => {
			const parser = new ObsidianParser({ 
				stringify: { bullet: '*' } 
			})
			const ast = await parser.parse('- item 1\n- item 2')
			const output = await parser.stringify(ast)
			expect(output).toContain('* item 1')
		})

		it('should accept parse config', () => {
			const parser = new ObsidianParser({ 
				parse: { position: false } 
			})
			expect(parser).toBeInstanceOf(ObsidianParser)
		})
	})
})
