import { describe, it, expect } from 'vitest'
import { ObsidianParser } from '../ObsidianParser'

describe('Simple Wiki Link Test', () => {
  it('should parse [[Note]]', async () => {
    const parser = new ObsidianParser()
    const ast = await parser.parse('[[Note]]')
    const paragraph = ast.children[0]
    expect(paragraph?.type).toBe('paragraph')
    const link = (paragraph as any)?.children?.[0]
    expect(link?.type).toBe('wikiLink')
    expect(link?.value).toBe('Note')
  })
})
