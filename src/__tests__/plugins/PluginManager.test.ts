import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PluginManager, PluginBase, type ObsidianPlugin } from '../../plugins/PluginManager'
import type { Root } from 'mdast'

describe('PluginManager', () => {
	let pluginManager: PluginManager

	beforeEach(() => {
		pluginManager = new PluginManager()
	})

	function createMockPlugin(overrides: Partial<ObsidianPlugin> = {}): ObsidianPlugin {
		return {
			name: 'test-plugin',
			version: '1.0.0',
			priority: 100,
			...overrides
		}
	}

	describe('register', () => {
		it('should register a plugin', () => {
			const plugin = createMockPlugin()
			pluginManager.register(plugin)
			expect(pluginManager.get(plugin.name)).toBe(plugin)
		})

		it('should call initialize on plugin', () => {
			const initialize = vi.fn()
			const plugin = createMockPlugin({ initialize })
			pluginManager.register(plugin)
			expect(initialize).toHaveBeenCalled()
		})

		it('should warn when registering duplicate plugin', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
			const plugin = createMockPlugin({ name: 'duplicate' })
			pluginManager.register(plugin)
			pluginManager.register(plugin)
			expect(consoleSpy).toHaveBeenCalledWith(
				'Plugin "duplicate" is already registered. Skipping.'
			)
			consoleSpy.mockRestore()
		})

		it('should not register duplicate plugin', () => {
			const plugin1 = createMockPlugin({ name: 'duplicate' })
			const plugin2 = createMockPlugin({ name: 'duplicate', version: '2.0.0' })
			pluginManager.register(plugin1)
			pluginManager.register(plugin2)
			expect(pluginManager.get('duplicate')?.version).toBe('1.0.0')
		})
	})

	describe('unregister', () => {
		it('should unregister a plugin', () => {
			const plugin = createMockPlugin()
			pluginManager.register(plugin)
			const result = pluginManager.unregister(plugin.name)
			expect(result).toBe(true)
			expect(pluginManager.get(plugin.name)).toBeUndefined()
		})

		it('should call dispose on plugin', () => {
			const dispose = vi.fn()
			const plugin = createMockPlugin({ dispose })
			pluginManager.register(plugin)
			pluginManager.unregister(plugin.name)
			expect(dispose).toHaveBeenCalled()
		})

		it('should return false if plugin not found', () => {
			const result = pluginManager.unregister('non-existent')
			expect(result).toBe(false)
		})
	})

	describe('get', () => {
		it('should return registered plugin', () => {
			const plugin = createMockPlugin({ name: 'my-plugin' })
			pluginManager.register(plugin)
			expect(pluginManager.get('my-plugin')).toBe(plugin)
		})

		it('should return undefined for non-existent plugin', () => {
			expect(pluginManager.get('non-existent')).toBeUndefined()
		})
	})

	describe('getAll', () => {
		it('should return all registered plugins', () => {
			const plugin1 = createMockPlugin({ name: 'plugin1' })
			const plugin2 = createMockPlugin({ name: 'plugin2' })
			pluginManager.register(plugin1)
			pluginManager.register(plugin2)
			const all = pluginManager.getAll()
			expect(all.length).toBe(2)
			expect(all).toContain(plugin1)
			expect(all).toContain(plugin2)
		})

		it('should return empty array when no plugins', () => {
			expect(pluginManager.getAll()).toEqual([])
		})
	})

	describe('getByPriority', () => {
		it('should return plugins sorted by priority', () => {
			const plugin1 = createMockPlugin({ name: 'low', priority: 200 })
			const plugin2 = createMockPlugin({ name: 'high', priority: 50 })
			const plugin3 = createMockPlugin({ name: 'medium', priority: 100 })
			pluginManager.register(plugin1)
			pluginManager.register(plugin2)
			pluginManager.register(plugin3)
			const sorted = pluginManager.getByPriority()
			expect(sorted[0].name).toBe('high')
			expect(sorted[1].name).toBe('medium')
			expect(sorted[2].name).toBe('low')
		})

		it('should use default priority of 100', () => {
			const plugin1 = createMockPlugin({ name: 'no-priority' })
			delete plugin1.priority
			const plugin2 = createMockPlugin({ name: 'low', priority: 200 })
			pluginManager.register(plugin1)
			pluginManager.register(plugin2)
			const sorted = pluginManager.getByPriority()
			expect(sorted[0].name).toBe('no-priority')
			expect(sorted[1].name).toBe('low')
		})
	})

	describe('getMicromarkExtensions', () => {
		it('should return all micromark extensions from plugins', () => {
			const ext1 = { name: 'ext1' }
			const ext2 = { name: 'ext2' }
			const plugin1 = createMockPlugin({ 
				name: 'p1',
				micromarkExtensions: [ext1 as never]
			})
			const plugin2 = createMockPlugin({ 
				name: 'p2',
				micromarkExtensions: [ext2 as never]
			})
			pluginManager.register(plugin1)
			pluginManager.register(plugin2)
			const extensions = pluginManager.getMicromarkExtensions()
			expect(extensions.length).toBe(2)
		})

		it('should return empty array when no extensions', () => {
			expect(pluginManager.getMicromarkExtensions()).toEqual([])
		})
	})

	describe('getFromMarkdownExtensions', () => {
		it('should return all from-markdown extensions from plugins', () => {
			const ext1 = { name: 'ext1' }
			const ext2 = { name: 'ext2' }
			const plugin1 = createMockPlugin({ 
				name: 'p1',
				fromMarkdownExtensions: [ext1 as never]
			})
			const plugin2 = createMockPlugin({ 
				name: 'p2',
				fromMarkdownExtensions: [ext2 as never]
			})
			pluginManager.register(plugin1)
			pluginManager.register(plugin2)
			const extensions = pluginManager.getFromMarkdownExtensions()
			expect(extensions.length).toBe(2)
		})
	})

	describe('getToMarkdownExtensions', () => {
		it('should merge to-markdown extensions from plugins', () => {
			const plugin1 = createMockPlugin({ 
				name: 'p1',
				toMarkdownExtensions: {
					handlers: { 
						testNode: () => 'test'
					}
				}
			})
			const plugin2 = createMockPlugin({ 
				name: 'p2',
				toMarkdownExtensions: {
					handlers: { 
						anotherNode: () => 'another'
					}
				}
			})
			pluginManager.register(plugin1)
			pluginManager.register(plugin2)
			const extensions = pluginManager.getToMarkdownExtensions()
			expect(extensions.handlers?.testNode).toBeDefined()
			expect(extensions.handlers?.anotherNode).toBeDefined()
		})

		it('should merge unsafe patterns', () => {
			const plugin1 = createMockPlugin({ 
				name: 'p1',
				toMarkdownExtensions: {
					unsafe: [{ character: '@' }]
				}
			})
			const plugin2 = createMockPlugin({ 
				name: 'p2',
				toMarkdownExtensions: {
					unsafe: [{ character: '#' }]
				}
			})
			pluginManager.register(plugin1)
			pluginManager.register(plugin2)
			const extensions = pluginManager.getToMarkdownExtensions()
			expect(extensions.unsafe?.length).toBe(2)
		})

		it('should merge join functions', () => {
			const plugin = createMockPlugin({ 
				name: 'p1',
				toMarkdownExtensions: {
					join: [() => 1]
				}
			})
			pluginManager.register(plugin)
			const extensions = pluginManager.getToMarkdownExtensions()
			expect(extensions.join?.length).toBe(1)
		})
	})

	describe('processAst', () => {
		it('should process AST through all plugins', () => {
			const mockAst: Root = { type: 'root', children: [] }
			const modifiedAst: Root = { type: 'root', children: [{ type: 'paragraph', children: [] }] }
			const astProcessor = vi.fn(() => modifiedAst)
			const plugin = createMockPlugin({ astProcessor })
			pluginManager.register(plugin)
			const result = pluginManager.processAst(mockAst)
			expect(astProcessor).toHaveBeenCalledWith(mockAst)
			expect(result).toEqual(modifiedAst)
		})

		it('should process AST in priority order', () => {
			const order: string[] = []
			const plugin1 = createMockPlugin({ 
				name: 'second',
				priority: 200,
				astProcessor: (ast: Root) => {
					order.push('second')
					return ast
				}
			})
			const plugin2 = createMockPlugin({ 
				name: 'first',
				priority: 50,
				astProcessor: (ast: Root) => {
					order.push('first')
					return ast
				}
			})
			pluginManager.register(plugin1)
			pluginManager.register(plugin2)
			const mockAst: Root = { type: 'root', children: [] }
			pluginManager.processAst(mockAst)
			expect(order).toEqual(['first', 'second'])
		})

		it('should return original AST if no processors', () => {
			const mockAst: Root = { type: 'root', children: [] }
			const result = pluginManager.processAst(mockAst)
			expect(result).toBe(mockAst)
		})
	})

	describe('clear', () => {
		it('should clear all plugins', () => {
			const dispose1 = vi.fn()
			const dispose2 = vi.fn()
			const plugin1 = createMockPlugin({ name: 'p1', dispose: dispose1 })
			const plugin2 = createMockPlugin({ name: 'p2', dispose: dispose2 })
			pluginManager.register(plugin1)
			pluginManager.register(plugin2)
			pluginManager.clear()
			expect(pluginManager.getAll()).toEqual([])
			expect(dispose1).toHaveBeenCalled()
			expect(dispose2).toHaveBeenCalled()
		})
	})
})

describe('PluginBase', () => {
	class TestPlugin extends PluginBase {
		name = 'test-plugin'
		version = '1.0.0'
	}

	it('should provide default values', () => {
		const plugin = new TestPlugin()
		expect(plugin.name).toBe('test-plugin')
		expect(plugin.version).toBe('1.0.0')
		expect(plugin.priority).toBe(100)
	})

	it('should allow overriding values', () => {
		const plugin = new TestPlugin()
		plugin.priority = 50
		plugin.options = { custom: true }
		expect(plugin.priority).toBe(50)
		expect(plugin.options).toEqual({ custom: true })
	})

	it('should have default initialize and dispose methods', () => {
		const plugin = new TestPlugin()
		expect(() => plugin.initialize()).not.toThrow()
		expect(() => plugin.dispose()).not.toThrow()
	})
})
