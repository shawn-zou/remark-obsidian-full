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
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.dollarSign) {
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
      if (code !== codes.dollarSign) return nok(code)
      effects.exit('mathInlineValue')
      effects.enter('mathInlineMarker')
      effects.consume(code)
      effects.exit('mathInlineMarker')
      effects.exit('mathInline')
      return ok
    }
  }

  const tokenizeBlock: Tokenizer = function(effects, ok, nok) {
    let size = 0

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.dollarSign) return nok(code)
      effects.enter('mathBlock')
      effects.enter('mathBlockFence')
      effects.consume(code)
      return openSecond
    }

    function openSecond(code: Code): State | undefined {
      if (code !== codes.dollarSign) return nok(code)
      effects.consume(code)
      effects.exit('mathBlockFence')
      effects.enter('mathBlockValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.dollarSign) {
        return closeFirst
      }
      effects.consume(code)
      return data
    }

    function closeFirst(code: Code): State | undefined {
      if (code !== codes.dollarSign) return nok(code)
      effects.consume(code)
      return closeSecond
    }

    function closeSecond(code: Code): State | undefined {
      if (code !== codes.dollarSign) return nok(code)
      effects.exit('mathBlockValue')
      effects.enter('mathBlockFence')
      effects.consume(code)
      effects.exit('mathBlockFence')
      effects.exit('mathBlock')
      return ok
    }
  }

  const extensions: Extension = {
    flow: {
      [codes.dollarSign]: {
        name: 'mathBlock',
        tokenize: tokenizeBlock
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
