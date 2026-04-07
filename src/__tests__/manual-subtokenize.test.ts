import { describe, it, expect } from 'vitest'
import * as micromark from 'micromark'
import { wikiLink } from '../extensions/micromark/wiki-link'
import { codes } from 'micromark-util-symbol'

describe('Manual Subtokenize Test', () => {
  it('should manually test subcontent', () => {
    const parser = micromark.parse({ extensions: [wikiLink()] })
    const events = parser.document().write(micromark.preprocess()('[[Note]]', undefined, true))
    
    let chunkFlowToken: any = null
    let context: any = null
    
    for (const event of events) {
      if (event[1].type === 'chunkFlow') {
        chunkFlowToken = event[1]
        context = event[2]
        break
      }
    }
    
    if (!chunkFlowToken || !context) {
      throw new Error('chunkFlow token not found')
    }
    
    const tokenizer = context.parser.constructs.text
    const textParser = context.parser.text
    
    console.log('textParser:', textParser)
    
    const subParser = micromark.parse({ extensions: [wikiLink()] })
    console.log('subParser.text:', subParser.text)
    
    expect(events).toBeDefined()
  })
})
