import type { Root, Node } from 'mdast'

export interface ParseError {
  message: string
  line?: number
  column?: number
  offset?: number
  source?: string
  ruleId?: string
}

export interface ParseContext {
  text: string
  options: Record<string, unknown>
}

export interface ParserHooks {
  beforeParse?: (text: string, context: ParseContext) => string
  afterParse?: (ast: Root, context: ParseContext) => Root
  beforeStringify?: (ast: Root, context: ParseContext) => Root
  afterStringify?: (text: string, context: ParseContext) => string
  onNodeEnter?: (node: Node, context: ParseContext) => void | boolean
  onNodeExit?: (node: Node, context: ParseContext) => void
  onError?: (error: ParseError, context: ParseContext) => void
}

export type HookName = keyof ParserHooks

export class HookManager {
  private hooks: Map<HookName, Set<NonNullable<ParserHooks[HookName]>>> = new Map()

  register<K extends HookName>(name: K, hook: NonNullable<ParserHooks[K]>): () => void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, new Set())
    }
    const hookSet = this.hooks.get(name)!
    hookSet.add(hook)
    return () => {
      hookSet.delete(hook)
    }
  }

  unregister<K extends HookName>(name: K, hook: NonNullable<ParserHooks[K]>): boolean {
    const hookSet = this.hooks.get(name)
    if (hookSet) {
      return hookSet.delete(hook)
    }
    return false
  }

  clear(name?: HookName): void {
    if (name) {
      this.hooks.get(name)?.clear()
    } else {
      this.hooks.clear()
    }
  }

  async execute<K extends HookName>(
    name: K,
    ...args: Parameters<NonNullable<ParserHooks[K]>>
  ): Promise<ReturnType<NonNullable<ParserHooks[K]>> | undefined> {
    const hookSet = this.hooks.get(name)
    if (!hookSet || hookSet.size === 0) {
      return args[0] as ReturnType<NonNullable<ParserHooks[K]>>
    }

    let result = args[0]
    for (const hook of hookSet) {
      try {
        const hookResult = await (hook as (...args: unknown[]) => unknown)(...args)
        if (hookResult !== undefined) {
          result = hookResult as typeof result
        }
      } catch (error) {
        console.error(`Hook "${name}" error:`, error)
      }
    }
    return result as ReturnType<NonNullable<ParserHooks[K]>>
  }

  has(name: HookName): boolean {
    const hookSet = this.hooks.get(name)
    return hookSet !== undefined && hookSet.size > 0
  }
}

export function createHookManager(): HookManager {
  return new HookManager()
}
