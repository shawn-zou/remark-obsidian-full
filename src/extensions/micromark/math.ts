import type { Extension, Tokenizer, State, Code, Construct } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'
import { markdownLineEnding, markdownLineEndingOrSpace } from 'micromark-util-character'
import { factorySpace } from 'micromark-factory-space'

export interface MathOptions {
  singleDollarTextMath?: boolean
}

export function math(options?: MathOptions): Extension {
  const singleDollarTextMath = options?.singleDollarTextMath ?? true

  const tokenizeInline: Tokenizer = function(effects, ok, nok) {
    return start

    function start(code: Code): State | undefined {
      if (code !== codes.dollarSign) return nok(code)
      effects.enter('mathInline')
      effects.enter('mathInlineMarker')
      effects.consume(code)
      effects.exit('mathInlineMarker')
      return afterOpen
    }

    function afterOpen(code: Code): State | undefined {
      if (code === codes.eof || code === codes.dollarSign) {
        effects.exit('mathInline')
        return nok(code)
      }
      effects.enter('mathInlineValue')
      effects.consume(code)
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) {
        effects.exit('mathInlineValue')
        effects.exit('mathInline')
        return nok(code)
      }
      if (code === codes.dollarSign) {
        effects.exit('mathInlineValue')
        effects.enter('mathInlineMarker')
        effects.consume(code)
        effects.exit('mathInlineMarker')
        effects.exit('mathInline')
        return ok(code)
      }
      effects.consume(code)
      return data
    }
  }

  const tokenizeBlock: Tokenizer = function(effects, ok, nok) {
    const self = this
    const closingFenceConstruct: Construct = {
      tokenize: tokenizeClosingFence,
      partial: true
    }
    let sizeOpen = 0

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.dollarSign) return nok(code)
      effects.enter('mathBlock')
      effects.enter('mathBlockMarker')
      effects.consume(code)
      sizeOpen = 1
      return sequenceOpen
    }

    function sequenceOpen(code: Code): State | undefined {
      if (code === codes.dollarSign) {
        effects.consume(code)
        sizeOpen++
        return sequenceOpen
      }
      if (sizeOpen < 2) {
        effects.exit('mathBlockMarker')
        effects.exit('mathBlock')
        return nok(code)
      }
      effects.exit('mathBlockMarker')
      return factorySpace(effects, afterOpen, 'whitespace')(code)
    }

    function afterOpen(code: Code): State | undefined {
      if (code === codes.eof) {
        effects.exit('mathBlock')
        return nok(code)
      }
      if (markdownLineEnding(code)) {
        effects.enter('lineEnding')
        effects.consume(code)
        effects.exit('lineEnding')
        return self.interrupt ? ok(code) : contentStart
      }
      effects.exit('mathBlock')
      return nok(code)
    }

    function contentStart(code: Code): State | undefined {
      if (code === codes.eof) {
        effects.exit('mathBlock')
        return nok(code)
      }
      return effects.attempt(closingFenceConstruct, after, content)(code)
    }

    function content(code: Code): State | undefined {
      if (code === codes.eof) {
        effects.exit('mathBlock')
        return nok(code)
      }
      if (markdownLineEnding(code)) {
        effects.enter('lineEnding')
        effects.consume(code)
        effects.exit('lineEnding')
        return contentStart
      }
      effects.enter('mathBlockValue')
      effects.consume(code)
      return contentContinue
    }

    function contentContinue(code: Code): State | undefined {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit('mathBlockValue')
        return content(code)
      }
      effects.consume(code)
      return contentContinue
    }

    function after(code: Code): State | undefined {
      effects.exit('mathBlock')
      return ok(code)
    }

    function tokenizeClosingFence(effects: any, ok: any, nok: any): State | undefined {
      let size = 0

      return factorySpace(effects, closingSequenceStart, 'linePrefix', 4)

      function closingSequenceStart(code: Code): State | undefined {
        if (code !== codes.dollarSign) {
          return nok(code)
        }
        effects.enter('mathBlockMarker')
        effects.consume(code)
        size = 1
        return closingSequence
      }

      function closingSequence(code: Code): State | undefined {
        if (code === codes.dollarSign) {
          effects.consume(code)
          size++
          return closingSequence
        }
        if (size < sizeOpen) {
          return nok(code)
        }
        effects.exit('mathBlockMarker')
        return factorySpace(effects, closingSequenceEnd, 'whitespace')(code)
      }

      function closingSequenceEnd(code: Code): State | undefined {
        if (code === codes.eof || markdownLineEnding(code)) {
          return ok(code)
        }
        return nok(code)
      }
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
