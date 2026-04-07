import type { Extension as MicromarkExtension } from 'micromark-util-types'
import type { Extension as FromMarkdownExtension } from 'mdast-util-from-markdown'
import type { Options as ToMarkdownExtension } from 'mdast-util-to-markdown'
import type { Root, Node } from 'mdast'

export interface ObsidianPlugin {
  name: string
  version: string
  priority?: number
  micromarkExtensions?: MicromarkExtension[]
  fromMarkdownExtensions?: FromMarkdownExtension[]
  toMarkdownExtensions?: ToMarkdownExtension
  astProcessor?: (ast: Root) => Root
  options?: Record<string, unknown>
  initialize?: () => void | Promise<void>
  dispose?: () => void | Promise<void>
}

export abstract class PluginBase implements ObsidianPlugin {
  abstract name: string
  abstract version: string
  priority: number = 100
  options?: Record<string, unknown>
  micromarkExtensions?: MicromarkExtension[]
  fromMarkdownExtensions?: FromMarkdownExtension[]
  toMarkdownExtensions?: ToMarkdownExtension
  astProcessor?: (ast: Root) => Root

  initialize(): void | Promise<void> {}
  dispose(): void | Promise<void> {}
}

export class PluginManager {
  private plugins: Map<string, ObsidianPlugin> = new Map()

  register(plugin: ObsidianPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already registered. Skipping.`)
      return
    }
    this.plugins.set(plugin.name, plugin)
    if (plugin.initialize) {
      plugin.initialize()
    }
  }

  unregister(name: string): boolean {
    const plugin = this.plugins.get(name)
    if (plugin) {
      if (plugin.dispose) {
        plugin.dispose()
      }
      return this.plugins.delete(name)
    }
    return false
  }

  get(name: string): ObsidianPlugin | undefined {
    return this.plugins.get(name)
  }

  getAll(): ObsidianPlugin[] {
    return Array.from(this.plugins.values())
  }

  getByPriority(): ObsidianPlugin[] {
    return this.getAll().sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
  }

  getMicromarkExtensions(): MicromarkExtension[] {
    return this.getByPriority().flatMap(p => p.micromarkExtensions ?? [])
  }

  getFromMarkdownExtensions(): FromMarkdownExtension[] {
    return this.getByPriority().flatMap(p => p.fromMarkdownExtensions ?? [])
  }

  getToMarkdownExtensions(): ToMarkdownExtension[] {
    const extensions: ToMarkdownExtension[] = {}
    for (const plugin of this.getByPriority()) {
      if (plugin.toMarkdownExtensions) {
        if (plugin.toMarkdownExtensions.handlers) {
          extensions.handlers = { ...extensions.handlers, ...plugin.toMarkdownExtensions.handlers }
        }
        if (plugin.toMarkdownExtensions.unsafe) {
          extensions.unsafe = [...(extensions.unsafe ?? []), ...plugin.toMarkdownExtensions.unsafe]
        }
        if (plugin.toMarkdownExtensions.join) {
          extensions.join = [...(extensions.join ?? []), ...plugin.toMarkdownExtensions.join]
        }
      }
    }
    return extensions
  }

  processAst(ast: Root): Root {
    let result = ast
    for (const plugin of this.getByPriority()) {
      if (plugin.astProcessor) {
        result = plugin.astProcessor(result)
      }
    }
    return result
  }

  clear(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.dispose) {
        plugin.dispose()
      }
    }
    this.plugins.clear()
  }
}
