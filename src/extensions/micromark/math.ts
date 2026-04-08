import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'

export interface MathOptions {
  singleDollarTextMath?: boolean
}

export function math(options?: MathOptions): Extension {
  const singleDollarTextMath = options?.singleDollarTextMath ?? true

  const tokenizeInline: Tokenizer = function(effects, ok, nok) {
    let size = 0

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.dollarSign) return nok(code)
      effects.enter('mathInline')
      effects.enter('mathInlineMarker')
      effects.consume(code)
      effects.exit('mathInlineMarker')
      effects.enter('mathInlineValue')
      return afterOpen
    }

    function afterOpen(code: Code): State | undefined {
      if (code === codes.dollarSign) return nok(code)
      if (code === codes.eof) return nok(code)
      return data(code)
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.dollarSign) {
        if (size === 0) return nok(code)
        effects.exit('mathInlineValue')
        effects.enter('mathInlineMarker')
        effects.consume(code)
        effects.exit('mathInlineMarker')
        effects.exit('mathInline')
        return ok(code)
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
  }

  const extensions: Extension = {}

  if (singleDollarTextMath) {
    extensions.text = {
      [codes.dollarSign]: {
        name: 'mathInline',
        tokenize: tokenizeInline
      }
    }
  }

  return extensions
}
