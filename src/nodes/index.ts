import type { Literal, Parent, BlockContent, DefinitionContent } from 'mdast'
import type { Position } from '../utils/position'

export { Position }

export enum NodeType {
  Root = 'root',
  Paragraph = 'paragraph',
  Heading = 'heading',
  Text = 'text',
  Code = 'code',
  InlineCode = 'inlineCode',
  Link = 'link',
  Image = 'image',
  List = 'list',
  ListItem = 'listItem',
  Blockquote = 'blockquote',
  ThematicBreak = 'thematicBreak',
  Html = 'html',
  Strong = 'strong',
  Emphasis = 'emphasis',
  Delete = 'delete',
  Break = 'break',
  Table = 'table',
  TableRow = 'tableRow',
  TableCell = 'tableCell',
  WikiLink = 'wikiLink',
  Embed = 'embed',
  Tag = 'tag',
  Callout = 'callout',
  Highlight = 'highlight',
  Comment = 'comment',
  FootnoteReference = 'footnoteReference',
  FootnoteDefinition = 'footnoteDefinition',
  BlockReference = 'blockReference',
  Frontmatter = 'frontmatter',
  Math = 'math',
  InlineMath = 'inlineMath',
}

export const EXCLUDED_NODE_TYPES: NodeType[] = [
  NodeType.Code,
  NodeType.InlineCode,
  NodeType.Link,
  NodeType.Image,
  NodeType.Html,
  NodeType.Strong,
  NodeType.Emphasis,
  NodeType.Math,
  NodeType.InlineMath,
  NodeType.WikiLink,
  NodeType.Embed,
  NodeType.Tag,
  NodeType.Callout,
  NodeType.Highlight,
  NodeType.Comment,
]

export interface BaseNode {
  type: string
  position?: Position
}

export interface RawText {
  value?: string
  alias?: string
  heading?: string
}

export interface WikiLink extends Literal {
  type: 'wikiLink'
  value: string
  alias?: string
  heading?: string
  blockId?: string
  raw?: RawText
  data?: {
    hName?: string
    hProperties?: Record<string, string>
    hChildren?: Array<{ type: string; value: string }>
  }
}

export interface Embed extends Literal {
  type: 'embed'
  value: string
  heading?: string
  blockId?: string
  width?: number
  height?: number
  raw?: RawText
  data?: {
    hName?: string
    hProperties?: Record<string, string>
    hChildren?: Array<{ type: string; value: string }>
  }
}

export interface Tag extends Literal {
  type: 'tag'
  value: string
  nested: string[]
  data?: {
    hName?: string
    hProperties?: Record<string, string>
  }
}

export interface Callout extends Parent {
  type: 'callout'
  calloutType: string
  title?: string
  foldable?: '+' | '-'
  data?: {
    hName?: string
    hProperties?: Record<string, string>
  }
}

export interface Highlight extends Parent {
  type: 'highlight'
  data?: {
    hName?: string
  }
}

export interface Comment extends Literal {
  type: 'comment'
  value: string
  data?: {
    hName?: string
  }
}

export interface FootnoteReference extends Literal {
  type: 'footnoteReference'
  identifier: string
  inline?: boolean
  inlineContent?: string
  data?: {
    hName?: string
    hProperties?: Record<string, string>
  }
}

export interface FootnoteDefinition extends Parent {
  type: 'footnoteDefinition'
  identifier: string
  children: (BlockContent | DefinitionContent)[]
  data?: {
    hName?: string
    hProperties?: Record<string, string>
  }
}

export interface BlockReference extends Literal {
  type: 'blockReference'
  identifier: string
  data?: {
    hName?: string
    hProperties?: Record<string, string>
  }
}

export interface Frontmatter extends Literal {
  type: 'frontmatter'
  value: string
  data?: Record<string, unknown>
}

export interface Math extends Literal {
  type: 'math'
  value: string
  inline: boolean
  data?: {
    hName?: string
  }
}

export type ObsidianNode =
  | WikiLink
  | Embed
  | Tag
  | Callout
  | Highlight
  | Comment
  | FootnoteReference
  | FootnoteDefinition
  | BlockReference
  | Frontmatter
  | Math

declare module 'mdast' {
  interface RootContentMap {
    wikiLink: WikiLink
    embed: Embed
    tag: Tag
    callout: Callout
    highlight: Highlight
    comment: Comment
    footnoteReference: FootnoteReference
    footnoteDefinition: FootnoteDefinition
    blockReference: BlockReference
    frontmatter: Frontmatter
    math: Math
  }
}

export type {
  Literal,
  Parent,
  Root,
  Node
} from 'mdast'
