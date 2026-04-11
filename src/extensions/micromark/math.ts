import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'

export interface MathOptions {
  singleDollarTextMath?: boolean
}

export function math(options?: MathOptions): Extension {
  const singleDollarTextMath = options?.singleDollarTextMath ?? true

  const tokenizeInline: Tokenizer = function(effects, ok, nok) {
    let hasContent = false

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.dollarSign) return nok(code)
      effects.enter('mathInline')
      effects.enter('mathInlineMarker')
      effects.consume(code)
      effects.exit('mathInlineMarker')
      effects.enter('mathInlineValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) {
        effects.exit('mathInlineValue')
        effects.exit('mathInline')
        return nok(code)
      }
      if (code === codes.dollarSign) {
        if (!hasContent) {
          effects.exit('mathInlineValue')
          effects.exit('mathInline')
          return nok(code)
        }
        effects.exit('mathInlineValue')
        effects.enter('mathInlineMarker')
        effects.consume(code)
        effects.exit('mathInlineMarker')
        effects.exit('mathInline')
        return ok(code)
      }
      hasContent = true
      effects.consume(code)
      return data
    }
  }

  const tokenizeBlock: Tokenizer = function(effects, ok, nok) {
    let hasContent = false

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.dollarSign) return nok(code)
      effects.enter('mathBlock')
      effects.enter('mathBlockMarker')
      effects.consume(code)
      return open
    }

    function open(code: Code): State | undefined {
      if (code !== codes.dollarSign) {
        effects.exit('mathBlockMarker')
        effects.exit('mathBlock')
        return nok(code)
      }
      effects.consume(code)
      effects.exit('mathBlockMarker')
      effects.enter('mathBlockValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) {
        effects.exit('mathBlockValue')
        effects.exit('mathBlock')
        return nok(code)
      }
      if (code === codes.dollarSign) {
        const nextCode = effects.peek?.() || 0
        if (nextCode === codes.dollarSign) {
          if (!hasContent) {
            effects.exit('mathBlockValue')
            effects.exit('mathBlock')
            return nok(code)
          }
          effects.consume(code)
          effects.consume(nextCode)
          effects.exit('mathBlockValue')
          effects.enter('mathBlockMarker')
          effects.exit('mathBlockMarker')
          effects.exit('mathBlock')
          return ok(code)
        }
      }
      hasContent = true
      effects.consume(code)
      return data
    }
  }

  const extensions: Extension = {
    flow: {
      [codes.dollarSign]: {
        name: 'mathBlock',
        tokenize: tokenizeBlock,
        concrete: true
      }
    }
  }

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
