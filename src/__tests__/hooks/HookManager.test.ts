import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HookManager, createHookManager, type HookName, type ParseContext } from '../../hooks/HookManager'
import type { Root } from 'mdast'

describe('HookManager', () => {
	let hookManager: HookManager

	beforeEach(() => {
		hookManager = new HookManager()
	})

	describe('register', () => {
		it('should register a hook', () => {
			const hook = vi.fn()
			hookManager.register('beforeParse', hook)
			expect(hookManager.has('beforeParse')).toBe(true)
		})

		it('should return an unregister function', () => {
			const hook = vi.fn()
			const unregister = hookManager.register('beforeParse', hook)
			expect(hookManager.has('beforeParse')).toBe(true)
			unregister()
			expect(hookManager.has('beforeParse')).toBe(false)
		})

		it('should allow multiple hooks for the same event', () => {
			const hook1 = vi.fn()
			const hook2 = vi.fn()
			hookManager.register('beforeParse', hook1)
			hookManager.register('beforeParse', hook2)
			expect(hookManager.has('beforeParse')).toBe(true)
		})
	})

	describe('unregister', () => {
		it('should unregister a hook', () => {
			const hook = vi.fn()
			hookManager.register('beforeParse', hook)
			const result = hookManager.unregister('beforeParse', hook)
			expect(result).toBe(true)
			expect(hookManager.has('beforeParse')).toBe(false)
		})

		it('should return false if hook not found', () => {
			const hook = vi.fn()
			const result = hookManager.unregister('beforeParse', hook)
			expect(result).toBe(false)
		})

		it('should only unregister the specific hook', () => {
			const hook1 = vi.fn()
			const hook2 = vi.fn()
			hookManager.register('beforeParse', hook1)
			hookManager.register('beforeParse', hook2)
			hookManager.unregister('beforeParse', hook1)
			expect(hookManager.has('beforeParse')).toBe(true)
		})
	})

	describe('clear', () => {
		it('should clear all hooks for a specific event', () => {
			hookManager.register('beforeParse', vi.fn())
			hookManager.register('beforeParse', vi.fn())
			hookManager.register('afterParse', vi.fn())
			hookManager.clear('beforeParse')
			expect(hookManager.has('beforeParse')).toBe(false)
			expect(hookManager.has('afterParse')).toBe(true)
		})

		it('should clear all hooks when no event specified', () => {
			hookManager.register('beforeParse', vi.fn())
			hookManager.register('afterParse', vi.fn())
			hookManager.register('beforeStringify', vi.fn())
			hookManager.clear()
			expect(hookManager.has('beforeParse')).toBe(false)
			expect(hookManager.has('afterParse')).toBe(false)
			expect(hookManager.has('beforeStringify')).toBe(false)
		})
	})

	describe('execute', () => {
		it('should execute beforeParse hooks', async () => {
			const hook = vi.fn((text: string) => text.toUpperCase())
			hookManager.register('beforeParse', hook)
			const context: ParseContext = { text: 'test', options: {} }
			const result = await hookManager.execute('beforeParse', 'test', context)
			expect(hook).toHaveBeenCalledWith('test', context)
			expect(result).toBe('TEST')
		})

		it('should execute afterParse hooks', async () => {
			const mockAst: Root = { type: 'root', children: [] }
			const modifiedAst: Root = { type: 'root', children: [{ type: 'paragraph', children: [] }] }
			const hook = vi.fn(() => modifiedAst)
			hookManager.register('afterParse', hook)
			const context: ParseContext = { text: 'test', options: {} }
			const result = await hookManager.execute('afterParse', mockAst, context)
			expect(result).toEqual(modifiedAst)
		})

		it('should execute hooks in order', async () => {
			const order: string[] = []
			hookManager.register('beforeParse', (text: string) => {
				order.push('first')
				return text
			})
			hookManager.register('beforeParse', (text: string) => {
				order.push('second')
				return text
			})
			const context: ParseContext = { text: 'test', options: {} }
			await hookManager.execute('beforeParse', 'test', context)
			expect(order).toEqual(['first', 'second'])
		})

		it('should use last hook result that returns a value', async () => {
			hookManager.register('beforeParse', (text: string) => text + '1')
			hookManager.register('beforeParse', (text: string) => text + '2')
			const context: ParseContext = { text: 'test', options: {} }
			const result = await hookManager.execute('beforeParse', 'test', context)
			expect(result).toBe('test2')
		})

		it('should return original value if no hooks registered', async () => {
			const context: ParseContext = { text: 'test', options: {} }
			const result = await hookManager.execute('beforeParse', 'test', context)
			expect(result).toBe('test')
		})

		it('should handle hooks that return undefined', async () => {
			hookManager.register('beforeParse', () => undefined as unknown as string)
			hookManager.register('beforeParse', (text: string) => text.toUpperCase())
			const context: ParseContext = { text: 'test', options: {} }
			const result = await hookManager.execute('beforeParse', 'test', context)
			expect(result).toBe('TEST')
		})

		it('should handle errors in hooks gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			hookManager.register('beforeParse', () => {
				throw new Error('Hook error')
			})
			hookManager.register('beforeParse', (text: string) => text.toUpperCase())
			const context: ParseContext = { text: 'test', options: {} }
			const result = await hookManager.execute('beforeParse', 'test', context)
			expect(consoleSpy).toHaveBeenCalled()
			expect(result).toBe('TEST')
			consoleSpy.mockRestore()
		})
	})

	describe('has', () => {
		it('should return true when hooks exist', () => {
			hookManager.register('beforeParse', vi.fn())
			expect(hookManager.has('beforeParse')).toBe(true)
		})

		it('should return false when no hooks exist', () => {
			expect(hookManager.has('beforeParse')).toBe(false)
		})

		it('should return false after all hooks are unregistered', () => {
			const hook = vi.fn()
			hookManager.register('beforeParse', hook)
			hookManager.unregister('beforeParse', hook)
			expect(hookManager.has('beforeParse')).toBe(false)
		})
	})

	describe('all hook types', () => {
		const hookTypes: HookName[] = [
			'beforeParse',
			'afterParse',
			'beforeStringify',
			'afterStringify',
			'onError'
		]

		hookTypes.forEach(hookType => {
			it(`should support ${hookType} hook`, () => {
				const hook = vi.fn()
				hookManager.register(hookType, hook as never)
				expect(hookManager.has(hookType)).toBe(true)
			})
		})
	})
})

describe('createHookManager', () => {
	it('should create a new HookManager instance', () => {
		const manager = createHookManager()
		expect(manager).toBeInstanceOf(HookManager)
	})

	it('should create independent instances', () => {
		const manager1 = createHookManager()
		const manager2 = createHookManager()
		manager1.register('beforeParse', vi.fn())
		expect(manager1.has('beforeParse')).toBe(true)
		expect(manager2.has('beforeParse')).toBe(false)
	})
})
