import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'

export function comment(): Extension {
  const tokenize: Tokenizer = function(effects, ok, nok) {
    let size = 0

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.percentSign) return nok(code)
      effects.enter('comment')
      effects.enter('commentMarker')
      effects.consume(code)
      return open
    }

    function open(code: Code): State | undefined {
      if (code !== codes.percentSign) return nok(code)
      effects.consume(code)
      effects.exit('commentMarker')
      effects.enter('commentValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.percentSign) {
        if (size === 0) return nok(code)
        effects.exit('commentValue')
        effects.enter('commentMarker')
        effects.consume(code)
        return closeStart
      }
      size++
      effects.consume(code)
      return data
    }

    function closeStart(code: Code): State | undefined {
      if (code !== codes.percentSign) {
        effects.exit('commentMarker')
        effects.enter('commentValue')
        size++
        effects.consume(code)
        return data
      }
      effects.consume(code)
      effects.exit('commentMarker')
      effects.exit('comment')
      return ok(code)
    }
  }

  return {
    text: {
      [codes.percentSign]: {
        name: 'comment',
        tokenize
      }
    }
  }
}
