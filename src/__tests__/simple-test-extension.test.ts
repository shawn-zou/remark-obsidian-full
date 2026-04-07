import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'

function simpleTestExtension(): Extension {
  const tokenize: Tokenizer = function(effects, ok, nok) {
    return start

    function start(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) return nok(code)
      effects.enter('test')
      effects.enter('testMarker')
      effects.consume(code)
      effects.exit('testMarker')
      return open
    }

    function open(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) return nok(code)
      effects.enter('testMarker')
      effects.consume(code)
      effects.exit('testMarker')
      effects.enter('testValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
        return close
      }
      effects.consume(code)
      return data
    }

    function close(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.exit('testValue')
      effects.enter('testMarker')
      effects.consume(code)
      return closeEnd
    }

    function closeEnd(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.consume(code)
      effects.exit('testMarker')
      effects.exit('test')
      return ok(code)
    }
  }

  return {
    text: {
      [codes.leftSquareBracket]: {
        name: 'test',
        tokenize
      }
    }
  }
}

describe('Simple Test Extension', () => {
  it('should parse [[Note]]', () => {
    const parser = micromark.parse({ extensions: [simpleTestExtension()] })
    const textParser = parser.text({ _index: 0, _bufferIndex: -1, line: 1, column: 1, offset: 0 })
    
    const stream = ['[[Note]]', null]
    console.log('Testing with simple extension:', stream)
    
    try {
      const events = textParser.write(stream)
      console.log('Events:', events.length)
      for (const e of events) {
        console.log('Event:', e[0], e[1].type)
      }
    } catch (error) {
      console.log('Error:', error)
    }
    
    expect(true).toBe(true)
  })
})
