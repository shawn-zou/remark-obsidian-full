import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('Micromark Parse Behavior Test', () => {
  it('should check what parse returns', () => {
    const parser = micromark.parse({
      extensions: [wikiLink()]
    })
    console.log('parser type:', typeof parser)
    console.log('parser keys:', Object.keys(parser))
    
    const result = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    console.log('result type:', typeof result)
    console.log('result:', JSON.stringify(result, null, 2))
    
    expect(result).toBeDefined()
  })
})
