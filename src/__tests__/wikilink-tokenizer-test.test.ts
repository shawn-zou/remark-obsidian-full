import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('WikiLink Tokenizer Test', () => {
  it('should tokenize [[Note]] at text level', () => {
    const extension = wikiLink()
    const tokenizer = extension.text![91].tokenize
    
    const events: Array<[string, any, any]> = []
    const context = {
      events,
      parser: {
        constructs: {
          text: extension.text
        }
      },
      previous: null,
      currentConstruct: null,
      sliceStream: () => ['[[Note]]'],
      sliceSerialize: () => '[[Note]]',
      now: () => ({ _index: 0, _bufferIndex: 0, line: 1, column: 1, offset: 0 }),
      defineSkip: () => {}
    }
    
    let state: any = tokenizer.call(
      context,
      {
        enter: (type: string) => {
          events.push(['enter', { type, start: context.now() }, context])
          return { type, start: context.now() }
        },
        exit: (type: string) => {
          events.push(['exit', { type, end: context.now() }, context])
          return { type, end: context.now() }
        },
        consume: (code: number | null) => {
          events.push(['consume', { code }, context])
        }
      },
      () => {
        console.log('ok called')
        return undefined
      },
      (code: number | null) => {
        console.log('nok called with code:', code)
        return undefined
      }
    )
    
    const input = '[[Note]]'
    let i = 0
    
    while (state && i < input.length) {
      const code = input.charCodeAt(i)
      console.log(`Calling state with code: ${code} (${input[i]})`)
      state = state(code)
      i++
    }
    
    console.log('Events:', events)
    expect(events.length).toBeGreaterThan(0)
  })
})
