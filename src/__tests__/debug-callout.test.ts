import { ObsidianParser } from '../ObsidianParser'

describe('Callout Debug', () => {
  it('should parse basic callout', async () => {
    const input = '> [!note]\n> content'
    console.log('Testing:', JSON.stringify(input))
    
    const parser = new ObsidianParser()
    try {
      const ast = await parser.parse(input)
      console.log('AST:', JSON.stringify(ast, null, 2))
      expect(ast.children[0]?.type).toBe('callout')
    } catch (e) {
      console.error('Error:', e)
      throw e
    }
  })
  
  it('should parse callout with title', async () => {
    const input = '> [!note] Title\n> content'
    console.log('Testing:', JSON.stringify(input))
    
    const parser = new ObsidianParser()
    try {
      const ast = await parser.parse(input)
      console.log('AST:', JSON.stringify(ast, null, 2))
      expect(ast.children[0]?.type).toBe('callout')
    } catch (e) {
      console.error('Error:', e)
      throw e
    }
  })
})
