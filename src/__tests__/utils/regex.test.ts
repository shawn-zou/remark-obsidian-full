import { describe, it, expect } from 'vitest'
import { PATTERNS, CALLOUT_TYPES, isCalloutType, normalizeCalloutType } from '../../utils/regex'

describe('regex patterns', () => {
	describe('PATTERNS.wikiLink', () => {
		it('should match basic wiki link', () => {
			const text = '[[Note Name]]'
			const matches = text.match(PATTERNS.wikiLink)
			expect(matches).not.toBeNull()
			expect(matches?.[0]).toBe('[[Note Name]]')
		})

		it('should match wiki link with alias', () => {
			const text = '[[Note|Display]]'
			const matches = text.match(PATTERNS.wikiLink)
			expect(matches).not.toBeNull()
			expect(matches?.[0]).toBe('[[Note|Display]]')
		})

		it('should match wiki link with heading', () => {
			const text = '[[Note#Section]]'
			const matches = text.match(PATTERNS.wikiLink)
			expect(matches).not.toBeNull()
		})

		it('should match wiki link with block id', () => {
			const text = '[[Note#^block123]]'
			const matches = text.match(PATTERNS.wikiLink)
			expect(matches).not.toBeNull()
		})

		it('should match multiple wiki links', () => {
			const text = '[[link1]] and [[link2]]'
			const matches = [...text.matchAll(PATTERNS.wikiLink)]
			expect(matches.length).toBe(2)
		})
	})

	describe('PATTERNS.wikiLinkValue', () => {
		it('should parse basic wiki link value', () => {
			const match = 'Note Name'.match(PATTERNS.wikiLinkValue)
			expect(match?.[1]).toBe('Note Name')
		})

		it('should parse wiki link with alias', () => {
			const match = 'Note|Display'.match(PATTERNS.wikiLinkValue)
			expect(match?.[1]).toBe('Note')
			expect(match?.[3]).toBe('Display')
		})

		it('should parse wiki link with heading', () => {
			const match = 'Note#Section'.match(PATTERNS.wikiLinkValue)
			expect(match?.[1]).toBe('Note')
			expect(match?.[2]).toBe('Section')
		})

		it('should parse wiki link with block id', () => {
			const match = 'Note#^block123'.match(PATTERNS.wikiLinkValue)
			expect(match?.[1]).toBe('Note')
			expect(match?.[2]).toBe('^block123')
		})
	})

	describe('PATTERNS.embed', () => {
		it('should match basic embed', () => {
			const text = '![[image.png]]'
			const matches = text.match(PATTERNS.embed)
			expect(matches).not.toBeNull()
			expect(matches?.[0]).toBe('![[image.png]]')
		})

		it('should match embed with dimensions', () => {
			const text = '![[image.png|100x200]]'
			const matches = text.match(PATTERNS.embed)
			expect(matches).not.toBeNull()
		})

		it('should not match regular wiki link', () => {
			const text = '[[image.png]]'
			const matches = text.match(PATTERNS.embed)
			expect(matches).toBeNull()
		})
	})

	describe('PATTERNS.embedValue', () => {
		it('should parse embed with dimensions', () => {
			const match = 'image.png|100x200'.match(PATTERNS.embedValue)
			expect(match?.[1]).toBe('image.png')
			expect(match?.[3]).toBe('100')
			expect(match?.[4]).toBe('200')
		})

		it('should parse embed with width only', () => {
			const match = 'image.png|100'.match(PATTERNS.embedValue)
			expect(match?.[1]).toBe('image.png')
			expect(match?.[3]).toBe('100')
			expect(match?.[4]).toBeUndefined()
		})
	})

	describe('PATTERNS.tag', () => {
		it('should match basic tag', () => {
			const text = '#tag'
			const matches = text.match(PATTERNS.tag)
			expect(matches).not.toBeNull()
			expect(matches?.[0]).toBe('#tag')
		})

		it('should match nested tag', () => {
			const text = '#nested/tag/here'
			const matches = text.match(PATTERNS.tag)
			expect(matches).not.toBeNull()
		})

		it('should match tag with unicode', () => {
			const text = '#标签'
			const matches = text.match(PATTERNS.tag)
			expect(matches).not.toBeNull()
		})

		it('should match multiple tags', () => {
			const text = '#tag1 #tag2 #tag3'
			const matches = [...text.matchAll(PATTERNS.tag)]
			expect(matches.length).toBe(3)
		})
	})

	describe('PATTERNS.callout', () => {
		it('should match basic callout', () => {
			const text = '> [!note] Title'
			const match = text.match(PATTERNS.callout)
			expect(match).not.toBeNull()
			expect(match?.[1]).toBe('note')
			expect(match?.[3]).toBe('Title')
		})

		it('should match callout without title', () => {
			const text = '> [!warning]'
			const match = text.match(PATTERNS.callout)
			expect(match).not.toBeNull()
			expect(match?.[1]).toBe('warning')
		})

		it('should match foldable callout', () => {
			const text = '> [!tip]+ Expandable'
			const match = text.match(PATTERNS.callout)
			expect(match).not.toBeNull()
			expect(match?.[2]).toBe('+')
		})

		it('should match collapsed callout', () => {
			const text = '> [!tip]- Collapsed'
			const match = text.match(PATTERNS.callout)
			expect(match).not.toBeNull()
			expect(match?.[2]).toBe('-')
		})
	})

	describe('PATTERNS.highlight', () => {
		it('should match highlighted text', () => {
			const text = '==highlighted=='
			const matches = text.match(PATTERNS.highlight)
			expect(matches).not.toBeNull()
			expect(matches?.[0]).toBe('==highlighted==')
		})

		it('should match multiple highlights', () => {
			const text = '==one== and ==two=='
			const matches = [...text.matchAll(PATTERNS.highlight)]
			expect(matches.length).toBe(2)
		})
	})

	describe('PATTERNS.comment', () => {
		it('should match comment', () => {
			const text = '%%comment%%'
			const matches = text.match(PATTERNS.comment)
			expect(matches).not.toBeNull()
			expect(matches?.[0]).toBe('%%comment%%')
		})

		it('should match multi-word comment', () => {
			const text = '%%this is a comment%%'
			const matches = text.match(PATTERNS.comment)
			expect(matches).not.toBeNull()
		})
	})

	describe('PATTERNS.footnoteRef', () => {
		it('should match footnote reference', () => {
			const text = '[^1]'
			const matches = text.match(PATTERNS.footnoteRef)
			expect(matches).not.toBeNull()
		})

		it('should match named footnote reference', () => {
			const text = '[^note]'
			const matches = text.match(PATTERNS.footnoteRef)
			expect(matches).not.toBeNull()
		})
	})

	describe('PATTERNS.footnoteDef', () => {
		it('should match footnote definition', () => {
			const text = '[^1]: This is a footnote'
			const match = text.match(PATTERNS.footnoteDef)
			expect(match).not.toBeNull()
			expect(match?.[1]).toBe('1')
			expect(match?.[2]).toBe('This is a footnote')
		})
	})

	describe('PATTERNS.inlineFootnote', () => {
		it('should match inline footnote', () => {
			const text = '^[inline footnote]'
			const matches = text.match(PATTERNS.inlineFootnote)
			expect(matches).not.toBeNull()
		})
	})

	describe('PATTERNS.blockRef', () => {
		it('should match block reference', () => {
			const text = 'Some text ^block123'
			const match = text.match(PATTERNS.blockRef)
			expect(match).not.toBeNull()
			expect(match?.[1]).toBe('block123')
		})
	})

	describe('PATTERNS.frontmatter', () => {
		it('should match frontmatter', () => {
			const text = `---
title: Test
---`
			const match = text.match(PATTERNS.frontmatter)
			expect(match).not.toBeNull()
		})
	})

	describe('PATTERNS.inlineMath', () => {
		it('should match inline math', () => {
			const text = '$x = y$'
			const matches = text.match(PATTERNS.inlineMath)
			expect(matches).not.toBeNull()
			expect(matches?.[0]).toBe('$x = y$')
		})

		it('should match multiple inline math', () => {
			const text = '$a$ and $b$'
			const matches = [...text.matchAll(PATTERNS.inlineMath)]
			expect(matches.length).toBe(2)
		})
	})

	describe('PATTERNS.blockMath', () => {
		it('should match block math', () => {
			const text = '$$x = y$$'
			const matches = text.match(PATTERNS.blockMath)
			expect(matches).not.toBeNull()
		})
	})

	describe('PATTERNS.strikethrough', () => {
		it('should match strikethrough', () => {
			const text = '~~deleted~~'
			const matches = text.match(PATTERNS.strikethrough)
			expect(matches).not.toBeNull()
			expect(matches?.[0]).toBe('~~deleted~~')
		})
	})
})

describe('callout types', () => {
	describe('CALLOUT_TYPES', () => {
		it('should contain standard callout types', () => {
			expect(CALLOUT_TYPES).toContain('note')
			expect(CALLOUT_TYPES).toContain('info')
			expect(CALLOUT_TYPES).toContain('tip')
			expect(CALLOUT_TYPES).toContain('warning')
			expect(CALLOUT_TYPES).toContain('danger')
		})

		it('should contain alias types', () => {
			expect(CALLOUT_TYPES).toContain('abstract')
			expect(CALLOUT_TYPES).toContain('summary')
			expect(CALLOUT_TYPES).toContain('tldr')
		})

		it('should be a readonly array', () => {
			expect(Array.isArray(CALLOUT_TYPES)).toBe(true)
		})
	})

	describe('isCalloutType', () => {
		it('should return true for valid callout types', () => {
			expect(isCalloutType('note')).toBe(true)
			expect(isCalloutType('info')).toBe(true)
			expect(isCalloutType('tip')).toBe(true)
			expect(isCalloutType('warning')).toBe(true)
		})

		it('should return false for invalid callout types', () => {
			expect(isCalloutType('invalid')).toBe(false)
			expect(isCalloutType('NOTE')).toBe(false)
			expect(isCalloutType('')).toBe(false)
		})

		it('should be case sensitive', () => {
			expect(isCalloutType('Note')).toBe(false)
			expect(isCalloutType('NOTE')).toBe(false)
			expect(isCalloutType('note')).toBe(true)
		})
	})

	describe('normalizeCalloutType', () => {
		it('should normalize uppercase to lowercase', () => {
			expect(normalizeCalloutType('NOTE')).toBe('note')
			expect(normalizeCalloutType('TIP')).toBe('tip')
			expect(normalizeCalloutType('WARNING')).toBe('warning')
		})

		it('should normalize mixed case to lowercase', () => {
			expect(normalizeCalloutType('Note')).toBe('note')
			expect(normalizeCalloutType('TiP')).toBe('tip')
		})

		it('should return "note" for invalid types', () => {
			expect(normalizeCalloutType('invalid')).toBe('note')
			expect(normalizeCalloutType('')).toBe('note')
		})

		it('should preserve valid types', () => {
			expect(normalizeCalloutType('note')).toBe('note')
			expect(normalizeCalloutType('info')).toBe('info')
		})
	})
})
