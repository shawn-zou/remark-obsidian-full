import type { Extension, Tokenizer, State, Code, Construct, Exiter } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'
import { factorySpace } from 'micromark-factory-space'
import { markdownLineEnding, markdownSpace } from 'micromark-util-character'
import { CALLOUT_TYPES, normalizeCalloutType } from '../../utils/regex'

export interface CalloutOptions {
  types?: readonly string[]
}

export function callout(options?: CalloutOptions): Extension {
  const allowedTypes = options?.types ?? CALLOUT_TYPES

  const tokenize: Tokenizer = function(effects, ok, nok) {
    const self = this
    let typeValue = ''

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.greaterThan) return nok(code)
      
      const state = self.containerState
      if (!state?.open) {
        effects.enter('callout', {_container: true})
        if (state) state.open = true
      }
      
      effects.enter('calloutPrefix')
      effects.enter('calloutMarker')
      effects.consume(code)
      effects.exit('calloutMarker')
      return afterMarker
    }

    function afterMarker(code: Code): State | undefined {
      if (markdownSpace(code)) {
        effects.enter('calloutPrefixWhitespace')
        effects.consume(code)
        effects.exit('calloutPrefixWhitespace')
        effects.exit('calloutPrefix')
        return openBracket
      }
      effects.exit('calloutPrefix')
      return openBracket(code)
    }

    function openBracket(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) {
        const state = self.containerState
        if (state) state.open = undefined
        return nok(code)
      }
      effects.enter('calloutTypeMarker')
      effects.consume(code)
      effects.exit('calloutTypeMarker')
      return exclamation
    }

    function exclamation(code: Code): State | undefined {
      if (code !== codes.exclamationMark) {
        const state = self.containerState
        if (state) state.open = undefined
        return nok(code)
      }
      effects.enter('calloutTypeMarker')
      effects.consume(code)
      effects.exit('calloutTypeMarker')
      effects.enter('calloutType')
      return typeStart
    }

    function typeStart(code: Code): State | undefined {
      if (code === codes.rightSquareBracket) {
        const state = self.containerState
        if (state) state.open = undefined
        return nok(code)
      }
      return type(code)
    }

    function type(code: Code): State | undefined {
      if (code === codes.eof) {
        const state = self.containerState
        if (state) state.open = undefined
        return nok(code)
      }
      if (code === codes.rightSquareBracket) {
        if (typeValue.length === 0) {
          const state = self.containerState
          if (state) state.open = undefined
          return nok(code)
        }
        effects.exit('calloutType')
        effects.enter('calloutTypeMarker')
        effects.consume(code)
        effects.exit('calloutTypeMarker')
        return afterTypeMarker
      }
      if (code === codes.plusSign || code === codes.dash) {
        if (typeValue.length === 0) {
          const state = self.containerState
          if (state) state.open = undefined
          return nok(code)
        }
        effects.exit('calloutType')
        effects.enter('calloutFoldable')
        effects.consume(code)
        effects.exit('calloutFoldable')
        return afterFoldable
      }
      if (
        (code >= codes.lowercaseA && code <= codes.lowercaseZ) ||
        (code >= codes.uppercaseA && code <= codes.uppercaseZ) ||
        code === codes.digit0 ||
        code === codes.digit1 ||
        code === codes.digit2 ||
        code === codes.digit3 ||
        code === codes.digit4 ||
        code === codes.digit5 ||
        code === codes.digit6 ||
        code === codes.digit7 ||
        code === codes.digit8 ||
        code === codes.digit9
      ) {
        typeValue += String.fromCharCode(code)
        effects.consume(code)
        return type
      }
      const state = self.containerState
      if (state) state.open = undefined
      return nok(code)
    }

    function afterFoldable(code: Code): State | undefined {
      if (code === codes.rightSquareBracket) {
        effects.enter('calloutTypeMarker')
        effects.consume(code)
        effects.exit('calloutTypeMarker')
        return afterTypeMarker
      }
      const state = self.containerState
      if (state) state.open = undefined
      return nok(code)
    }

    function afterTypeMarker(code: Code): State | undefined {
      if (markdownLineEnding(code) || code === codes.eof) {
        return ok(code)
      }
      if (markdownSpace(code)) {
        effects.enter('calloutTitle')
        effects.consume(code)
        return titleStart
      }
      effects.enter('calloutTitle')
      return titleContent(code)
    }

    function titleStart(code: Code): State | undefined {
      if (markdownLineEnding(code) || code === codes.eof) {
        effects.exit('calloutTitle')
        return ok(code)
      }
      if (markdownSpace(code)) {
        effects.consume(code)
        return titleStart
      }
      return titleContent(code)
    }

    function titleContent(code: Code): State | undefined {
      if (markdownLineEnding(code) || code === codes.eof) {
        effects.exit('calloutTitle')
        return ok(code)
      }
      effects.consume(code)
      return titleContent
    }
  }

  const continuation: Tokenizer = function(effects, ok, nok) {
    const self = this
    return contStart

    function contStart(code: Code): State | undefined {
      if (markdownSpace(code)) {
        return factorySpace(
          effects,
          contBefore,
          'linePrefix',
          self.parser.constructs.disable.null?.includes('codeIndented')
            ? undefined
            : 4
        )(code)
      }
      return contBefore(code)
    }

    function contBefore(code: Code): State | undefined {
      if (code === codes.greaterThan) {
        effects.enter('calloutPrefix')
        effects.enter('calloutMarker')
        effects.consume(code)
        effects.exit('calloutMarker')
        return contAfterMarker
      }
      return nok(code)
    }

    function contAfterMarker(code: Code): State | undefined {
      if (markdownSpace(code)) {
        effects.enter('calloutPrefixWhitespace')
        effects.consume(code)
        effects.exit('calloutPrefixWhitespace')
        effects.exit('calloutPrefix')
        return ok
      }
      effects.exit('calloutPrefix')
      return ok(code)
    }
  }

  const exit: Exiter = function(effects) {
    effects.exit('callout')
  }

  const calloutConstruct: Construct = {
    name: 'callout',
    tokenize,
    continuation: { tokenize: continuation },
    exit
  }

  return {
    document: {
      [codes.greaterThan]: calloutConstruct
    }
  }
}

export function parseCalloutType(type: string): {
  type: string
  foldable?: '+' | '-' | undefined
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
