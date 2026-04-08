import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'

export function highlight(): Extension {
  const tokenize: Tokenizer = function(effects, ok, nok) {
    let size = 0

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.equalsTo) return nok(code)
      effects.enter('highlight')
      effects.enter('highlightMarker')
      effects.consume(code)
      return open
    }

    function open(code: Code): State | undefined {
      if (code !== codes.equalsTo) return nok(code)
      effects.consume(code)
      effects.exit('highlightMarker')
      effects.enter('highlightValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.equalsTo) {
        if (size === 0) return nok(code)
        return close(code)
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
      if (code !== codes.equalsTo) return nok(code)
      effects.consume(code)
      return closeEnd
    }

    function closeEnd(code: Code): State | undefined {
      if (code !== codes.equalsTo) return nok(code)
      effects.exit('highlightValue')
      effects.enter('highlightMarker')
      effects.consume(code)
      effects.exit('highlightMarker')
      effects.exit('highlight')
      return ok(code)
    }
  }

  return {
    text: {
      [codes.equalsTo]: {
        name: 'highlight',
        tokenize
      }
    }
  }
}
