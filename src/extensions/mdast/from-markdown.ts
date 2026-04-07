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

let currentWikiLink: Partial<WikiLink> | null = null
let currentEmbed: Partial<Embed> | null = null
let currentTag: Partial<Tag> | null = null
let currentCallout: Partial<Callout> | null = null
let currentHighlight: Partial<Highlight> | null = null
let currentComment: Partial<Comment> | null = null
let currentFootnoteRef: Partial<FootnoteReference> | null = null
let currentFootnoteDef: Partial<FootnoteDefinition> | null = null
let currentBlockRef: Partial<BlockReference> | null = null
let currentMath: Partial<Math> | null = null

const enterWikiLink: Handle = function(token) {
  currentWikiLink = {
    type: 'wikiLink',
    value: ''
  }
  this.enter(currentWikiLink as WikiLink, token)
}

const exitWikiLinkValue: Handle = function(token) {
  const raw = this.sliceSerialize(token)
  const parsed = parseWikiLinkValue(raw)
  if (currentWikiLink) {
    currentWikiLink.value = parsed.value
    currentWikiLink.alias = parsed.alias
    currentWikiLink.heading = parsed.heading
    currentWikiLink.blockId = parsed.blockId
    currentWikiLink.raw = parsed.raw
  }
}

const exitWikiLink: Handle = function(token) {
  this.exit(token)
  currentWikiLink = null
}

const enterEmbed: Handle = function(token) {
  currentEmbed = {
    type: 'embed',
    value: ''
  }
  this.enter(currentEmbed as Embed, token)
}

const exitEmbedValue: Handle = function(token) {
  const raw = this.sliceSerialize(token)
  const parsed = parseEmbedValue(raw)
  if (currentEmbed) {
    currentEmbed.value = parsed.value
    currentEmbed.heading = parsed.heading
    currentEmbed.blockId = parsed.blockId
    currentEmbed.width = parsed.width
    currentEmbed.height = parsed.height
    currentEmbed.raw = parsed.raw
  }
}

const exitEmbed: Handle = function(token) {
  this.exit(token)
  currentEmbed = null
}

const enterTag: Handle = function(token) {
  currentTag = {
    type: 'tag',
    value: '',
    nested: []
  }
  this.enter(currentTag as Tag, token)
}

const exitTagValue: Handle = function(token) {
  const raw = this.sliceSerialize(token)
  const parsed = parseTagValue(raw)
  if (currentTag) {
    currentTag.value = parsed.value
    currentTag.nested = parsed.nested
  }
}

const exitTag: Handle = function(token) {
  this.exit(token)
  currentTag = null
}

const enterCallout: Handle = function(token) {
  currentCallout = {
    type: 'callout',
    calloutType: 'note',
    children: []
  }
  this.enter(currentCallout as Callout, token)
}

const exitCalloutType: Handle = function(token) {
  const raw = this.sliceSerialize(token)
  const parsed = parseCalloutType(raw)
  if (currentCallout) {
    currentCallout.calloutType = parsed.type
    currentCallout.foldable = parsed.foldable
  }
}

const exitCalloutTitle: Handle = function(token) {
  const title = this.sliceSerialize(token).trim()
  if (currentCallout && title) {
    currentCallout.title = title
  }
}

const exitCallout: Handle = function(token) {
  this.exit(token)
  currentCallout = null
}

const enterHighlight: Handle = function(token) {
  currentHighlight = {
    type: 'highlight',
    children: []
  }
  this.enter(currentHighlight as Highlight, token)
}

const exitHighlightValue: Handle = function(token) {
  const value = this.sliceSerialize(token)
  if (currentHighlight) {
    currentHighlight.children = [{
      type: 'text',
      value
    }]
  }
}

const exitHighlight: Handle = function(token) {
  this.exit(token)
  currentHighlight = null
}

const enterComment: Handle = function(token) {
  currentComment = {
    type: 'comment',
    value: ''
  }
  this.enter(currentComment as Comment, token)
}

const exitCommentValue: Handle = function(token) {
  if (currentComment) {
    currentComment.value = this.sliceSerialize(token)
  }
}

const exitComment: Handle = function(token) {
  this.exit(token)
  currentComment = null
}

const enterFootnoteReference: Handle = function(token) {
  currentFootnoteRef = {
    type: 'footnoteReference',
    identifier: ''
  }
  this.enter(currentFootnoteRef as FootnoteReference, token)
}

const exitFootnoteReferenceId: Handle = function(token) {
  if (currentFootnoteRef) {
    currentFootnoteRef.identifier = this.sliceSerialize(token)
  }
}

const exitFootnoteReference: Handle = function(token) {
  this.exit(token)
  currentFootnoteRef = null
}

const enterFootnoteDefinition: Handle = function(token) {
  currentFootnoteDef = {
    type: 'footnoteDefinition',
    identifier: '',
    children: []
  }
  this.enter(currentFootnoteDef as FootnoteDefinition, token)
}

const exitFootnoteDefinitionId: Handle = function(token) {
  if (currentFootnoteDef) {
    currentFootnoteDef.identifier = this.sliceSerialize(token)
  }
}

const exitFootnoteDefinitionValue: Handle = function(token) {
  const value = this.sliceSerialize(token)
  if (currentFootnoteDef) {
    currentFootnoteDef.children = [{
      type: 'paragraph',
      children: [{ type: 'text', value }]
    }]
  }
}

const exitFootnoteDefinition: Handle = function(token) {
  this.exit(token)
  currentFootnoteDef = null
}

const enterBlockReference: Handle = function(token) {
  currentBlockRef = {
    type: 'blockReference',
    identifier: ''
  }
  this.enter(currentBlockRef as BlockReference, token)
}

const exitBlockReferenceId: Handle = function(token) {
  if (currentBlockRef) {
    currentBlockRef.identifier = this.sliceSerialize(token)
  }
}

const exitBlockReference: Handle = function(token) {
  this.exit(token)
  currentBlockRef = null
}

const enterMathInline: Handle = function(token) {
  currentMath = {
    type: 'math',
    value: '',
    inline: true
  }
  this.enter(currentMath as Math, token)
}

const enterMathBlock: Handle = function(token) {
  currentMath = {
    type: 'math',
    value: '',
    inline: false
  }
  this.enter(currentMath as Math, token)
}

const exitMathInlineValue: Handle = function(token) {
  if (currentMath) {
    currentMath.value = this.sliceSerialize(token)
  }
}

const exitMathBlockValue: Handle = function(token) {
  if (currentMath) {
    currentMath.value = this.sliceSerialize(token)
  }
}

const exitMathInline: Handle = function(token) {
  this.exit(token)
  currentMath = null
}

const exitMathBlock: Handle = function(token) {
  this.exit(token)
  currentMath = null
}

const exitFootnoteInlineValue: Handle = function(token) {
  const value = this.sliceSerialize(token)
  if (currentFootnoteRef) {
    currentFootnoteRef.inline = true
    currentFootnoteRef.inlineContent = value
  }
}

const exitFootnoteInline: Handle = function(token) {
  this.exit(token)
  currentFootnoteRef = null
}
