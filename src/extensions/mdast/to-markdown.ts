import type { Options, Handle } from 'mdast-util-to-markdown'
import type { WikiLink, Embed, Tag, Callout, Highlight, Comment, FootnoteReference, FootnoteDefinition, BlockReference, Math } from '../../nodes'
import { escapeWikiLink } from '../../utils/escape'

export interface StringifyOptions {
  escapeMode?: 'preserve' | 'smart' | 'minimal'
}

export function obsidianToMarkdown(options?: StringifyOptions): Options {
  const escapeMode = options?.escapeMode ?? 'preserve'

  return {
    handlers: {
      wikiLink: handleWikiLink(escapeMode),
      embed: handleEmbed(escapeMode),
      tag: handleTag,
      callout: handleCallout,
      highlight: handleHighlight,
      comment: handleComment,
      footnoteReference: handleFootnoteReference,
      footnoteDefinition: handleFootnoteDefinition,
      blockReference: handleBlockReference,
      math: handleMath
    }
  }
}

function handleWikiLink(escapeMode: 'preserve' | 'smart' | 'minimal'): Handle {
  return (node) => {
    const wikiLink = node as WikiLink
    let value: string

    if (escapeMode === 'preserve' && wikiLink.raw) {
      value = wikiLink.raw.value ?? wikiLink.value
      if (wikiLink.heading) {
        value += '#' + (wikiLink.raw.heading ?? wikiLink.heading)
      }
      if (wikiLink.blockId) {
        value += '#^' + wikiLink.blockId
      }
      if (wikiLink.alias) {
        value += '|' + (wikiLink.raw.alias ?? wikiLink.alias)
      }
    } else {
      value = escapeWikiLink(wikiLink.value)
      if (wikiLink.heading) {
        value += '#' + escapeWikiLink(wikiLink.heading)
      }
      if (wikiLink.blockId) {
        value += '#^' + wikiLink.blockId
      }
      if (wikiLink.alias) {
        value += '|' + escapeWikiLink(wikiLink.alias)
      }
    }

    return `[[${value}]]`
  }
}

function handleEmbed(escapeMode: 'preserve' | 'smart' | 'minimal'): Handle {
  return (node) => {
    const embed = node as Embed
    let value: string

    if (escapeMode === 'preserve' && embed.raw) {
      value = embed.raw.value ?? embed.value
      if (embed.heading) {
        value += '#' + (embed.raw.heading ?? embed.heading)
      }
      if (embed.blockId) {
        value += '#^' + embed.blockId
      }
    } else {
      value = escapeWikiLink(embed.value)
      if (embed.heading) {
        value += '#' + escapeWikiLink(embed.heading)
      }
      if (embed.blockId) {
        value += '#^' + embed.blockId
      }
    }

    if (embed.width) {
      value += '|' + embed.width
      if (embed.height) {
        value += 'x' + embed.height
      }
    }

    return `![[${value}]]`
  }
}

const handleTag: Handle = (node) => {
  const tag = node as Tag
  return '#' + tag.value
}

const handleCallout: Handle = (node, _, context) => {
  const callout = node as Callout
  let result = '> '
  
  result += '[!' + callout.calloutType
  if (callout.foldable) {
    result += callout.foldable
  }
  result += ']'
  
  if (callout.title) {
    result += ' ' + callout.title
  }
  
  if (callout.children && callout.children.length > 0) {
    const children = context.containerFlow.call(context, callout, node)
    const lines = children.split('\n')
    for (const line of lines) {
      if (line.trim()) {
        result += '\n> ' + line
      }
    }
  }
  
  return result
}

const handleHighlight: Handle = (node, _, context) => {
  const highlight = node as Highlight
  const children = context.containerPhrasing.call(context, highlight, node)
  return '==' + children + '=='
}

const handleComment: Handle = (node) => {
  const comment = node as Comment
  return '%%' + comment.value + '%%'
}

const handleFootnoteReference: Handle = (node) => {
  const ref = node as FootnoteReference
  if (ref.inline && ref.inlineContent) {
    return '^[' + ref.inlineContent + ']'
  }
  return '[^' + ref.identifier + ']'
}

const handleFootnoteDefinition: Handle = (node, _, context) => {
  const def = node as FootnoteDefinition
  const children = context.containerFlow.call(context, def, node)
  return '[^' + def.identifier + ']: ' + children
}

const handleBlockReference: Handle = (node) => {
  const ref = node as BlockReference
  return '^' + ref.identifier
}

const handleMath: Handle = (node) => {
  const math = node as Math
  if (math.inline) {
    return '$' + math.value + '$'
  }
  return '$$' + math.value + '$$'
}
