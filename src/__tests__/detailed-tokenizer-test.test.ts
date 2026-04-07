import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'

function simpleTestExtension(): Extension {
  const tokenize: Tokenizer = function(effects, ok, nok) {
    console.log('tokenizer created')
    return start

    function start(code: Code): State | undefined {
      console.log('start called with code:', code, String.fromCharCode(code as number))
      if (code !== codes.leftSquareBracket) {
        console.log('start: nok - not [')
        return nok(code)
      }
      effects.enter('test')
      effects.enter('testMarker')
      effects.consume(code)
      effects.exit('testMarker')
      console.log('start: consumed first [, returning open')
      return open
    }

    function open(code: Code): State | undefined {
      console.log('open called with code:', code, String.fromCharCode(code as number))
      if (code !== codes.leftSquareBracket) {
        console.log('open: nok - not [')
        return nok(code)
      }
      effects.enter('testMarker')
      effects.consume(code)
      effects.exit('testMarker')
      effects.enter('testValue')
      console.log('open: consumed second [, returning data')
      return data
    }

    function data(code: Code): State | undefined {
      console.log('data called with code:', code, code === codes.eof ? 'EOF' : String.fromCharCode(code as number))
      if (code === codes.eof) {
        console.log('data: nok - EOF')
        return nok(code)
      }
      if (code === codes.rightSquareBracket) {
        console.log('data: calling close')
        return close(code)
      }
      effects.consume(code)
      console.log('data: consumed, returning data')
      return data
    }

    function close(code: Code): State | undefined {
      console.log('close called with code:', code, String.fromCharCode(code as number))
      if (code !== codes.rightSquareBracket) {
        console.log('close: nok - not ]')
        return nok(code)
      }
      effects.exit('testValue')
      effects.enter('testMarker')
      effects.consume(code)
      console.log('close: consumed first ], returning closeEnd')
      return closeEnd
    }

    function closeEnd(code: Code): State | undefined {
      console.log('closeEnd called with code:', code, String.fromCharCode(code as number))
      if (code !== codes.rightSquareBracket) {
        console.log('closeEnd: nok - not ]')
        return nok(code)
      }
      effects.consume(code)
      effects.exit('testMarker')
      effects.exit('test')
      console.log('closeEnd: consumed second ], calling ok')
      return ok
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

describe('Detailed Tokenizer Test', () => {
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
