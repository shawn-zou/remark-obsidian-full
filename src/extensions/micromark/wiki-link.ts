import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'
import { unescapeWikiLink } from '../../utils/escape'

export interface WikiLinkOptions {
  aliasDivider?: string
}

export function wikiLink(options?: WikiLinkOptions): Extension {
  const aliasDivider = options?.aliasDivider ?? '|'

  const tokenize: Tokenizer = function(effects, ok, nok) {
    let size = 0
    let hasAlias = false
    let hasHeading = false
    let hasBlockId = false

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) return nok(code)
      effects.enter('wikiLink')
      effects.enter('wikiLinkMarker')
      effects.consume(code)
      return open
    }

    function open(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) return nok(code)
      effects.consume(code)
      effects.exit('wikiLinkMarker')
      effects.enter('wikiLinkValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      
      if (code === codes.rightSquareBracket) {
        if (size === 0) return nok(code)
        return close
      }

      if (code === codes.backslash) {
        effects.consume(code)
        return escape
      }

      if (code === aliasDivider.charCodeAt(0)) {
        hasAlias = true
        effects.enter('wikiLinkAliasMarker')
        effects.consume(code)
        effects.exit('wikiLinkAliasMarker')
        effects.enter('wikiLinkAlias')
        return alias
      }

      if (code === codes.numberSign) {
        hasHeading = true
        effects.enter('wikiLinkHeadingMarker')
        effects.consume(code)
        effects.exit('wikiLinkHeadingMarker')
        effects.enter('wikiLinkHeading')
        return headingStart
      }

      size++
      effects.consume(code)
      return data
    }

    function escape(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      size++
      effects.consume(code)
      return data
    }

    function alias(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
        effects.exit('wikiLinkAlias')
        return close
      }
      if (code === codes.backslash) {
        effects.consume(code)
        return aliasEscape
      }
      effects.consume(code)
      return alias
    }

    function aliasEscape(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      effects.consume(code)
      return alias
    }

    function headingStart(code: Code): State | undefined {
      if (code === codes.caret) {
        hasBlockId = true
        effects.consume(code)
        effects.exit('wikiLinkHeading')
        effects.enter('wikiLinkBlockId')
        return blockId
      }
      return heading(code)
    }

    function heading(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
        effects.exit('wikiLinkHeading')
        return close
      }
      if (code === aliasDivider.charCodeAt(0)) {
        effects.exit('wikiLinkHeading')
        hasAlias = true
        effects.enter('wikiLinkAliasMarker')
        effects.consume(code)
        effects.exit('wikiLinkAliasMarker')
        effects.enter('wikiLinkAlias')
        return alias
      }
      effects.consume(code)
      return heading
    }

    function blockId(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
        effects.exit('wikiLinkBlockId')
        return close
      }
      if (code === aliasDivider.charCodeAt(0)) {
        effects.exit('wikiLinkBlockId')
        hasAlias = true
        effects.enter('wikiLinkAliasMarker')
        effects.consume(code)
        effects.exit('wikiLinkAliasMarker')
        effects.enter('wikiLinkAlias')
        return alias
      }
      effects.consume(code)
      return blockId
    }

    function close(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.exit('wikiLinkValue')
      effects.enter('wikiLinkMarker')
      effects.consume(code)
      return closeEnd
    }

    function closeEnd(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.consume(code)
      effects.exit('wikiLinkMarker')
      effects.exit('wikiLink')
      return ok
    }
  }

  return {
    text: {
      [codes.leftSquareBracket]: {
        name: 'wikiLink',
        tokenize
      }
    }
  }
}

export function parseWikiLinkValue(value: string, aliasDivider: string = '|'): {
  value: string
  alias?: string
  heading?: string
  blockId?: string
  raw: { value: string; alias?: string; heading?: string }
} {
  const rawFullValue = value
  let alias: string | undefined
  let heading: string | undefined
  let blockId: string | undefined
  let rawValue = value

  const aliasIndex = value.indexOf(aliasDivider)
  if (aliasIndex !== -1) {
    alias = value.slice(aliasIndex + 1)
    value = value.slice(0, aliasIndex)
    rawValue = value
  }

  const blockIdMatch = value.match(/#\^([a-zA-Z0-9\-]+)$/)
  if (blockIdMatch) {
    blockId = blockIdMatch[1]
    value = value.slice(0, -blockIdMatch[0].length)
    rawValue = value
  } else {
    const headingMatch = value.match(/#([^#]+)$/)
    if (headingMatch) {
      heading = headingMatch[1]
      value = value.slice(0, -headingMatch[0].length)
      rawValue = value
    }
  }

  return {
    value: unescapeWikiLink(value),
    alias: alias ? unescapeWikiLink(alias) : undefined,
    heading: heading ? unescapeWikiLink(heading) : undefined,
    blockId,
    raw: {
      value: rawValue,
      alias,
      heading
    }
  }
}
