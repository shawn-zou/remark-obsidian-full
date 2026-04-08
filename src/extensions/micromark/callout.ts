import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'
import { CALLOUT_TYPES, normalizeCalloutType } from '../../utils/regex'

export interface CalloutOptions {
  types?: readonly string[]
}

export function callout(options?: CalloutOptions): Extension {
  const allowedTypes = options?.types ?? CALLOUT_TYPES

  const tokenize: Tokenizer = function(effects, ok, nok) {
    let type = ''

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.greaterThan) return nok(code)
      effects.enter('callout')
      effects.enter('calloutMarker')
      effects.consume(code)
      effects.exit('calloutMarker')
      return space
    }

    function space(code: Code): State | undefined {
      if (code !== codes.space) {
        effects.exit('callout')
        return nok(code)
      }
      effects.consume(code)
      return openBracket
    }

    function openBracket(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) return nok(code)
      effects.enter('calloutTypeMarker')
      effects.consume(code)
      effects.exit('calloutTypeMarker')
      effects.enter('calloutType')
      return calloutType
    }

    function calloutType(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.exclamationMark) {
        effects.consume(code)
        return calloutTypeName
      }
      return nok(code)
    }

    function calloutTypeName(code: Code): State | undefined {
      if (code === null || code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
        if (type.length === 0) return nok(code)
        return closeType(code)
      }
      if (
        code >= codes.lowercaseA && code <= codes.lowercaseZ ||
        code >= codes.uppercaseA && code <= codes.uppercaseZ
      ) {
        type += String.fromCharCode(code)
        effects.consume(code)
        return calloutTypeName
      }
      return nok(code)
    }

    function closeType(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.exit('calloutType')
      effects.enter('calloutTypeMarker')
      effects.consume(code)
      effects.exit('calloutTypeMarker')
      effects.enter('calloutTitle')
      return title
    }

    function title(code: Code): State | undefined {
      if (code === codes.eof) {
        effects.exit('calloutTitle')
        effects.exit('callout')
        return ok(code)
      }
      if (code === codes.carriageReturn || code === codes.lineFeed) {
        effects.exit('calloutTitle')
        effects.exit('callout')
        return ok(code)
      }
      effects.consume(code)
      return title
    }
  }

  return {
    flow: {
      [codes.greaterThan]: {
        name: 'callout',
        tokenize,
        partial: true
      }
    }
  }
}

export function parseCalloutType(type: string): {
  type: string
  foldable?: '+' | '-'
} {
  let foldable: '+' | '-' | undefined
  
  if (type.endsWith('+')) {
    foldable = '+'
    type = type.slice(0, -1)
  } else if (type.endsWith('-')) {
    foldable = '-'
    type = type.slice(0, -1)
  }

  return {
    type: normalizeCalloutType(type),
    foldable
  }
}
