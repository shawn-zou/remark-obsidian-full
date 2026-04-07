import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'
import { unescapeWikiLink } from '../../utils/escape'

export interface EmbedOptions {
  aliasDivider?: string
}

export function embed(options?: EmbedOptions): Extension {
  const aliasDivider = options?.aliasDivider ?? '|'

  const tokenize: Tokenizer = function(effects, ok, nok) {
    let size = 0

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.exclamationMark) return nok(code)
      effects.enter('embed')
      effects.enter('embedMarker')
      effects.consume(code)
      return open
    }

    function open(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) return nok(code)
      effects.consume(code)
      return openBracket
    }

    function openBracket(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) return nok(code)
      effects.consume(code)
      effects.exit('embedMarker')
      effects.enter('embedValue')
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

    function close(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.exit('embedValue')
      effects.enter('embedMarker')
      effects.consume(code)
      effects.exit('embedMarker')
      effects.exit('embed')
      return ok
    }
  }

  return {
    text: {
      [codes.exclamationMark]: {
        name: 'embed',
        tokenize
      }
    }
  }
}

export function parseEmbedValue(value: string, aliasDivider: string = '|'): {
  value: string
  heading?: string
  blockId?: string
  width?: number
  height?: number
  raw: { value: string }
} {
  const rawValue = value
  let heading: string | undefined
  let blockId: string | undefined
  let width: number | undefined
  let height: number | undefined

  const sizeMatch = value.match(new RegExp(`\\${aliasDivider}(\\d+)(?:x(\\d+))?$`))
  if (sizeMatch) {
    width = parseInt(sizeMatch[1], 10)
    if (sizeMatch[2]) {
      height = parseInt(sizeMatch[2], 10)
    }
    value = value.slice(0, -sizeMatch[0].length)
  }

  const blockIdMatch = value.match(/#\^([a-zA-Z0-9\-]+)$/)
  if (blockIdMatch) {
    blockId = blockIdMatch[1]
    value = value.slice(0, -blockIdMatch[0].length)
  } else {
    const headingMatch = value.match(/#([^#]+)$/)
    if (headingMatch) {
      heading = headingMatch[1]
      value = value.slice(0, -headingMatch[0].length)
    }
  }

  return {
    value: unescapeWikiLink(value),
    heading: heading ? unescapeWikiLink(heading) : undefined,
    blockId,
    width,
    height,
    raw: { value: rawValue }
  }
}
