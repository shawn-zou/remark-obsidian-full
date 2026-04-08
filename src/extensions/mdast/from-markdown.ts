import type { Extension as FromMarkdownExtension, Handle } from 'mdast-util-from-markdown'
import type { WikiLink, Embed, Tag, Callout, Highlight, Comment, FootnoteReference, FootnoteDefinition, BlockReference, Math } from '../../nodes'
import { parseWikiLinkValue } from '../micromark/wiki-link'
import { parseEmbedValue } from '../micromark/embed'
import { parseTagValue } from '../micromark/tag'
import { parseCalloutType } from '../micromark/callout'

export function obsidianFromMarkdown(): FromMarkdownExtension {
  return {
    enter: {
      wikiLink: enterWikiLink,
      embed: enterEmbed,
      tag: enterTag,
      callout: enterCallout,
      highlight: enterHighlight,
      comment: enterComment,
      footnoteReference: enterFootnoteReference,
      footnoteInline: enterFootnoteInline,
      footnoteDefinition: enterFootnoteDefinition,
      blockReference: enterBlockReference,
      mathInline: enterMathInline,
      mathBlock: enterMathBlock
    },
    exit: {
      wikiLinkValue: exitWikiLinkValue,
      wikiLink: exitWikiLink,
      embedValue: exitEmbedValue,
      embed: exitEmbed,
      tagValue: exitTagValue,
      tag: exitTag,
      calloutType: exitCalloutType,
      calloutTitle: exitCalloutTitle,
      callout: exitCallout,
      highlightValue: exitHighlightValue,
      highlight: exitHighlight,
      commentValue: exitCommentValue,
      comment: exitComment,
      footnoteReferenceId: exitFootnoteReferenceId,
      footnoteReference: exitFootnoteReference,
      footnoteInlineValue: exitFootnoteInlineValue,
      footnoteInline: exitFootnoteInline,
      footnoteDefinitionId: exitFootnoteDefinitionId,
      footnoteDefinitionValue: exitFootnoteDefinitionValue,
      footnoteDefinition: exitFootnoteDefinition,
      blockReferenceId: exitBlockReferenceId,
      blockReference: exitBlockReference,
      mathInlineValue: exitMathInlineValue,
      mathInline: exitMathInline,
      mathBlockValue: exitMathBlockValue,
      mathBlock: exitMathBlock
    }
  }
}

function getTopNode<T>(stack: unknown[]): T | undefined {
  if (stack.length === 0) return undefined
  return stack[stack.length - 1] as T
}

const enterWikiLink: Handle = function(token) {
  const node: WikiLink = {
    type: 'wikiLink',
    value: ''
  }
  this.enter(node, token)
}

const exitWikiLinkValue: Handle = function(token) {
  const raw = this.sliceSerialize(token)
  const parsed = parseWikiLinkValue(raw)
  const node = getTopNode<WikiLink>(this.stack)
  if (node) {
    node.value = parsed.value
    node.alias = parsed.alias
    node.heading = parsed.heading
    node.blockId = parsed.blockId
    node.raw = parsed.raw
  }
}

const exitWikiLink: Handle = function(token) {
  this.exit(token)
}

const enterEmbed: Handle = function(token) {
  const node: Embed = {
    type: 'embed',
    value: ''
  }
  this.enter(node, token)
}

const exitEmbedValue: Handle = function(token) {
  const raw = this.sliceSerialize(token)
  const parsed = parseEmbedValue(raw)
  const node = getTopNode<Embed>(this.stack)
  if (node) {
    node.value = parsed.value
    node.heading = parsed.heading
    node.blockId = parsed.blockId
    node.width = parsed.width
    node.height = parsed.height
    node.raw = parsed.raw
  }
}

const exitEmbed: Handle = function(token) {
  this.exit(token)
}

const enterTag: Handle = function(token) {
  const node: Tag = {
    type: 'tag',
    value: '',
    nested: []
  }
  this.enter(node, token)
}

const exitTagValue: Handle = function(token) {
  const raw = this.sliceSerialize(token)
  const parsed = parseTagValue(raw)
  const node = getTopNode<Tag>(this.stack)
  if (node) {
    node.value = parsed.value
    node.nested = parsed.nested
  }
}

const exitTag: Handle = function(token) {
  this.exit(token)
}

const enterCallout: Handle = function(token) {
  const node: Callout = {
    type: 'callout',
    calloutType: 'note',
    children: []
  }
  this.enter(node, token)
}

const exitCalloutType: Handle = function(token) {
  const raw = this.sliceSerialize(token)
  const parsed = parseCalloutType(raw)
  const node = getTopNode<Callout>(this.stack)
  if (node) {
    node.calloutType = parsed.type
    node.foldable = parsed.foldable
  }
}

const exitCalloutTitle: Handle = function(token) {
  const title = this.sliceSerialize(token).trim()
  const node = getTopNode<Callout>(this.stack)
  if (node && title) {
    node.title = title
  }
}

const exitCallout: Handle = function(token) {
  this.exit(token)
}

const enterHighlight: Handle = function(token) {
  const node: Highlight = {
    type: 'highlight',
    children: []
  }
  this.enter(node, token)
}

const exitHighlightValue: Handle = function(token) {
  const value = this.sliceSerialize(token)
  const node = getTopNode<Highlight>(this.stack)
  if (node) {
    node.children = [{
      type: 'text',
      value
    }]
  }
}

const exitHighlight: Handle = function(token) {
  this.exit(token)
}

const enterComment: Handle = function(token) {
  const node: Comment = {
    type: 'comment',
    value: ''
  }
  this.enter(node, token)
}

const exitCommentValue: Handle = function(token) {
  const node = getTopNode<Comment>(this.stack)
  if (node) {
    node.value = this.sliceSerialize(token)
  }
}

const exitComment: Handle = function(token) {
  this.exit(token)
}

const enterFootnoteReference: Handle = function(token) {
  const node: FootnoteReference = {
    type: 'footnoteReference',
    identifier: '',
    value: ''
  }
  this.enter(node, token)
}

const enterFootnoteInline: Handle = function(token) {
  const node: FootnoteReference = {
    type: 'footnoteReference',
    identifier: '',
    value: '',
    inline: true,
    inlineContent: ''
  }
  this.enter(node, token)
}

const exitFootnoteReferenceId: Handle = function(token) {
  const node = getTopNode<FootnoteReference>(this.stack)
  if (node) {
    node.identifier = this.sliceSerialize(token)
  }
}

const exitFootnoteReference: Handle = function(token) {
  this.exit(token)
}

const enterFootnoteDefinition: Handle = function(token) {
  const node: FootnoteDefinition = {
    type: 'footnoteDefinition',
    identifier: '',
    children: []
  }
  this.enter(node, token)
}

const exitFootnoteDefinitionId: Handle = function(token) {
  const node = getTopNode<FootnoteDefinition>(this.stack)
  if (node) {
    node.identifier = this.sliceSerialize(token)
  }
}

const exitFootnoteDefinitionValue: Handle = function(token) {
  const value = this.sliceSerialize(token)
  const node = getTopNode<FootnoteDefinition>(this.stack)
  if (node) {
    node.children = [{
      type: 'paragraph',
      children: [{ type: 'text', value }]
    }]
  }
}

const exitFootnoteDefinition: Handle = function(token) {
  this.exit(token)
}

const enterBlockReference: Handle = function(token) {
  const node: BlockReference = {
    type: 'blockReference',
    identifier: '',
    value: ''
  }
  this.enter(node, token)
}

const exitBlockReferenceId: Handle = function(token) {
  const node = getTopNode<BlockReference>(this.stack)
  if (node) {
    node.identifier = this.sliceSerialize(token)
  }
}

const exitBlockReference: Handle = function(token) {
  this.exit(token)
}

const enterMathInline: Handle = function(token) {
  const node: Math = {
    type: 'math',
    value: '',
    inline: true
  }
  this.enter(node, token)
}

const enterMathBlock: Handle = function(token) {
  const node: Math = {
    type: 'math',
    value: '',
    inline: false
  }
  this.enter(node, token)
}

const exitMathInlineValue: Handle = function(token) {
  const node = getTopNode<Math>(this.stack)
  if (node) {
    node.value = this.sliceSerialize(token)
  }
}

const exitMathBlockValue: Handle = function(token) {
  const node = getTopNode<Math>(this.stack)
  if (node) {
    node.value = this.sliceSerialize(token)
  }
}

const exitMathInline: Handle = function(token) {
  this.exit(token)
}

const exitMathBlock: Handle = function(token) {
  this.exit(token)
}

const exitFootnoteInlineValue: Handle = function(token) {
  const value = this.sliceSerialize(token)
  const node = getTopNode<FootnoteReference>(this.stack)
  if (node) {
    node.inline = true
    node.inlineContent = value
  }
}

const exitFootnoteInline: Handle = function(token) {
  this.exit(token)
}
