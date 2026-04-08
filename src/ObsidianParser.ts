import { unified, type Processor } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import { visit } from 'unist-util-visit'
import type { Root, Node, Parent, Literal } from 'mdast'
import { obsidian as obsidianMicromark } from './extensions/micromark'
import { obsidianFromMarkdown, obsidianToMarkdown } from './extensions/mdast'
import { PluginManager, type ObsidianPlugin } from './plugins'
import { HookManager, type ParserHooks, type ParseContext } from './hooks'
import type { StringifyOptions } from './extensions/mdast/to-markdown'

export interface ParserConfig {
  syntax?: {
    wikiLink?: boolean | { aliasDivider?: string }
    embed?: boolean | { aliasDivider?: string }
    tag?: boolean | { allowNested?: boolean }
    callout?: boolean | { types?: readonly string[] }
    highlight?: boolean
    comment?: boolean
    footnote?: boolean
    blockRef?: boolean
    math?: boolean | { singleDollarTextMath?: boolean }
    frontmatter?: boolean
    gfm?: boolean
  }
  parse?: {
    position?: boolean
    errorRecovery?: boolean
  }
  stringify?: StringifyOptions
  plugins?: ObsidianPlugin[]
}

export class ObsidianParser {
  private config: ParserConfig
  private pluginManager: PluginManager
  private hookManager: HookManager
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseProcessor: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stringifyProcessor: any

  constructor(config?: ParserConfig) {
    this.config = config ?? {}
    this.pluginManager = new PluginManager()
    this.hookManager = new HookManager()
    
    this.parseProcessor = this.createParseProcessor()
    this.stringifyProcessor = this.createStringifyProcessor()
    
    if (this.config.plugins) {
      for (const plugin of this.config.plugins) {
        this.pluginManager.register(plugin)
      }
    }
  }

  private createParseProcessor() {
    const processor = unified()
      .use(remarkParse)
    
    const micromarkExtensions = obsidianMicromark()
    const fromMarkdownExtensions = [obsidianFromMarkdown()]
    
    processor.data('micromarkExtensions', micromarkExtensions)
    processor.data('fromMarkdownExtensions', fromMarkdownExtensions)
    
    if (this.config.syntax?.gfm !== false) {
      processor.use(remarkGfm)
    }
    
    if (this.config.syntax?.frontmatter !== false) {
      processor.use(remarkFrontmatter, ['yaml'])
    }
    
    const pluginMicromarkExtensions = this.pluginManager.getMicromarkExtensions()
    const pluginFromMarkdownExtensions = this.pluginManager.getFromMarkdownExtensions()
    
    if (pluginMicromarkExtensions.length > 0) {
      processor.data('micromarkExtensions', [...processor.data('micromarkExtensions') || [], ...pluginMicromarkExtensions])
    }
    if (pluginFromMarkdownExtensions.length > 0) {
      processor.data('fromMarkdownExtensions', [...processor.data('fromMarkdownExtensions') || [], ...pluginFromMarkdownExtensions])
    }
    
    return processor
  }

  private createStringifyProcessor() {
    const processor = unified()
      .use(remarkStringify, {
        bullet: '-',
        emphasis: '*',
        strong: '*',
        fence: '`',
        fences: true,
        incrementListMarker: true,
        ...this.config.stringify
      })
    
    const toMarkdownExtensions = obsidianToMarkdown(this.config.stringify)
    const pluginExtensions = this.pluginManager.getToMarkdownExtensions()
    
    processor.data('toMarkdownExtensions', [toMarkdownExtensions, pluginExtensions])
    
    return processor
  }

  get hooks(): ParserHooks {
    const self = this
    return {
      beforeParse: (fn) => { self.hookManager.register('beforeParse', fn) },
      afterParse: (fn) => { self.hookManager.register('afterParse', fn) },
      beforeStringify: (fn) => { self.hookManager.register('beforeStringify', fn) },
      afterStringify: (fn) => { self.hookManager.register('afterStringify', fn) },
      onError: (fn) => { self.hookManager.register('onError', fn) }
    }
  }

  async parse(text: string): Promise<Root> {
    const context: ParseContext = { text, options: this.config.parse ?? {} }
    
    let processedText = await this.hookManager.execute('beforeParse', text, context)
    if (processedText === undefined) processedText = text
    
    const ast = this.parseProcessor.parse(processedText) as Root
    
    let processedAst = await this.hookManager.execute('afterParse', ast, context)
    if (processedAst === undefined) processedAst = ast
    
    processedAst = this.pluginManager.processAst(processedAst)
    
    return processedAst
  }

  async stringify(ast: Root): Promise<string> {
    const context: ParseContext = { text: '', options: this.config.stringify ?? {} }
    
    let processedAst = await this.hookManager.execute('beforeStringify', ast, context)
    if (processedAst === undefined) processedAst = ast
    
    const text = this.stringifyProcessor.stringify(processedAst)
    
    let processedText = await this.hookManager.execute('afterStringify', String(text), context)
    if (processedText === undefined) processedText = String(text)
    
    return processedText
  }

  visit(ast: Root, visitor: (node: Node, index: number | null, parent: Parent | null) => void | boolean): void {
    visit(ast, visitor as Parameters<typeof visit>[1])
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visitByType(ast: Root, type: string | string[], visitor: (node: Node, index: number | null, parent: Parent | null) => void | boolean): void {
    (visit as any)(ast, type, visitor)
  }

  findNodesByType(ast: Root, type: string | string[]): Node[] {
    const types = Array.isArray(type) ? type : [type]
    const nodes: Node[] = []
    
    visit(ast, (node) => {
      if (types.includes(node.type)) {
        nodes.push(node)
      }
    })
    
    return nodes
  }

  getNodeText(node: Node): string {
    if ('value' in node) {
      return (node as Literal).value as string
    }
    
    if ('children' in node) {
      const parent = node as Parent
      return parent.children.map(child => this.getNodeText(child)).join('')
    }
    
    return ''
  }

  query(ast: Root, query: {
    type?: string | string[]
    filter?: (node: Node) => boolean
  }): Node[] {
    const typeArray = query.type 
      ? (Array.isArray(query.type) ? query.type : [query.type]) 
      : []
    const types = typeArray.length > 0 ? typeArray : null
    const nodes: Node[] = []
    
    visit(ast, (node) => {
      if (!types || types.includes(node.type)) {
        if (!query.filter || query.filter(node)) {
          nodes.push(node)
        }
      }
    })
    
    return nodes
  }

  registerPlugin(plugin: ObsidianPlugin): void {
    this.pluginManager.register(plugin)
    this.parseProcessor = this.createParseProcessor()
    this.stringifyProcessor = this.createStringifyProcessor()
  }

  unregisterPlugin(name: string): boolean {
    return this.pluginManager.unregister(name)
  }

  getPlugin(name: string): ObsidianPlugin | undefined {
    return this.pluginManager.get(name)
  }

  dispose(): void {
    this.pluginManager.clear()
    this.hookManager.clear()
  }
}

export function createParser(config?: ParserConfig): ObsidianParser {
  return new ObsidianParser(config)
}

export * from './nodes'
export * from './plugins'
export * from './hooks'
export * from './utils'
