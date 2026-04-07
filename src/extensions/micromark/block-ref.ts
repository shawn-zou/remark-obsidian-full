import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'

export function blockReference(): Extension {
  const tokenize: Tokenizer = function(effects, ok, nok) {
    return start

    function start(code: Code): State | undefined {
      if (code !== codes.caret) return nok(code)
      effects.enter('blockReference')
      effects.enter('blockReferenceMarker')
      effects.consume(code)
      effects.exit('blockReferenceMarker')
      effects.enter('blockReferenceId')
      return id
    }

    function id(code: Code): State | undefined {
      if (
        code === codes.eof ||
        code === codes.space ||
        code === codes.tab ||
        code === codes.carriageReturn ||
        code === codes.lineFeed
      ) {
        return end(code)
      }

      if (
        code >= codes.digit0 && code <= codes.digit9 ||
        code >= codes.lowercaseA && code <= codes.lowercaseZ ||
        code >= codes.uppercaseA && code <= codes.uppercaseZ ||
        code === codes.dash
      ) {
        effects.consume(code)
        return id
      }

      return nok(code)
    }

    function end(code: Code): State | undefined {
      effects.exit('blockReferenceId')
      effects.exit('blockReference')
      return ok(code)
    }
  }

  return {
    text: {
      [codes.caret]: {
        name: 'blockReference',
        tokenize
      }
    }
  }
}
