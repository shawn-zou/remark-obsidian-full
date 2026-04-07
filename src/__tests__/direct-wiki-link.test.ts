import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'

describe('Direct Micromark Wiki Link Test', () => {
  it('should parse [[Note]]', () => {
    const result = micromark.parse('[[Note]]', {
      extensions: [wikiLink()]
    })
    expect(result).toBeDefined()
  })
})
