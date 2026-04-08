import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'

export function footnote(): Extension {
  const tokenizeReference: Tokenizer = function(effects, ok, nok) {
    return start

    function start(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) return nok(code)
      effects.enter('footnoteReference')
      effects.enter('footnoteReferenceMarker')
      effects.consume(code)
      return open
    }

    function open(code: Code): State | undefined {
      if (code !== codes.caret) {
        effects.exit('footnoteReferenceMarker')
        effects.exit('footnoteReference')
        return nok(code)
      }
      effects.consume(code)
      effects.exit('footnoteReferenceMarker')
      effects.enter('footnoteReferenceId')
      return id
    }

    function id(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
        return close(code)
      }
      effects.consume(code)
      return id
    }

    function close(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.exit('footnoteReferenceId')
      effects.enter('footnoteReferenceMarker')
      effects.consume(code)
      effects.exit('footnoteReferenceMarker')
      effects.exit('footnoteReference')
      return ok(code)
    }
  }

  const tokenizeInline: Tokenizer = function(effects, ok, nok) {
    let size = 0

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.caret) return nok(code)
      effects.enter('footnoteInline')
      effects.enter('footnoteInlineMarker')
      effects.consume(code)
      effects.exit('footnoteInlineMarker')
      return open
    }

    function open(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) return nok(code)
      effects.enter('footnoteInlineMarker')
      effects.consume(code)
      effects.exit('footnoteInlineMarker')
      effects.enter('footnoteInlineValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
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
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.exit('footnoteInlineValue')
      effects.enter('footnoteInlineMarker')
      effects.consume(code)
      effects.exit('footnoteInlineMarker')
      effects.exit('footnoteInline')
      return ok(code)
    }
  }

  const tokenizeDefinition: Tokenizer = function(effects, ok, nok) {
    return start

    function start(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) return nok(code)
      effects.enter('footnoteDefinition')
      effects.enter('footnoteDefinitionMarker')
      effects.consume(code)
      return open
    }

    function open(code: Code): State | undefined {
      if (code !== codes.caret) {
        effects.exit('footnoteDefinitionMarker')
        effects.exit('footnoteDefinition')
        return nok(code)
      }
      effects.consume(code)
      effects.exit('footnoteDefinitionMarker')
      effects.enter('footnoteDefinitionId')
      return id
    }

    function id(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
        return colon(code)
      }
      effects.consume(code)
      return id
    }

    function colon(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.exit('footnoteDefinitionId')
      effects.enter('footnoteDefinitionMarker')
      effects.consume(code)
      effects.exit('footnoteDefinitionMarker')
      return colonCheck
    }

    function colonCheck(code: Code): State | undefined {
      if (code !== codes.colon) return nok(code)
      effects.enter('footnoteDefinitionMarker')
      effects.consume(code)
      effects.exit('footnoteDefinitionMarker')
      effects.enter('footnoteDefinitionValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) {
        effects.exit('footnoteDefinitionValue')
        effects.exit('footnoteDefinition')
        return ok(code)
      }
      if (code === codes.carriageReturn || code === codes.lineFeed) {
        effects.exit('footnoteDefinitionValue')
        effects.exit('footnoteDefinition')
        return ok(code)
      }
      effects.consume(code)
      return data
    }
  }

  return {
    text: {
      [codes.leftSquareBracket]: {
        name: 'footnoteReference',
        tokenize: tokenizeReference
      },
      [codes.caret]: {
        name: 'footnoteInline',
        tokenize: tokenizeInline
      }
    },
    flow: {
      [codes.leftSquareBracket]: {
        name: 'footnoteDefinition',
        tokenize: tokenizeDefinition
      }
    }
  }
}
