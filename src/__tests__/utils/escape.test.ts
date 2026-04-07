import { describe, it, expect } from 'vitest'
import {
	escapeWikiLink,
	unescapeWikiLink,
	needsEscape,
	escapeMinimal,
	escapeTag,
	unescapeTag,
	escapeHighlight,
	unescapeHighlight,
	escapeComment,
	unescapeComment,
	escapeCalloutTitle,
	unescapeCalloutTitle
} from '../../utils/escape'

describe('escape functions', () => {
	describe('escapeWikiLink', () => {
		it('should escape special characters in wiki link', () => {
			expect(escapeWikiLink('file|name')).toBe('file\\|name')
			expect(escapeWikiLink('file#heading')).toBe('file\\#heading')
			expect(escapeWikiLink('file^block')).toBe('file\\^block')
			expect(escapeWikiLink('path\\file')).toBe('path\\\\file')
		})

		it('should escape multiple special characters', () => {
			expect(escapeWikiLink('file|name#heading')).toBe('file\\|name\\#heading')
			expect(escapeWikiLink('a|b#c^d')).toBe('a\\|b\\#c\\^d')
		})

		it('should not modify text without special characters', () => {
			expect(escapeWikiLink('normal-file_name')).toBe('normal-file_name')
			expect(escapeWikiLink('simple')).toBe('simple')
		})

		it('should handle empty string', () => {
			expect(escapeWikiLink('')).toBe('')
		})
	})

	describe('unescapeWikiLink', () => {
		it('should unescape special characters', () => {
			expect(unescapeWikiLink('file\\|name')).toBe('file|name')
			expect(unescapeWikiLink('file\\#heading')).toBe('file#heading')
			expect(unescapeWikiLink('file\\^block')).toBe('file^block')
			expect(unescapeWikiLink('path\\\\file')).toBe('path\\file')
		})

		it('should unescape multiple special characters', () => {
			expect(unescapeWikiLink('file\\|name\\#heading')).toBe('file|name#heading')
			expect(unescapeWikiLink('a\\|b\\#c\\^d')).toBe('a|b#c^d')
		})

		it('should handle text without escapes', () => {
			expect(unescapeWikiLink('normal-file_name')).toBe('normal-file_name')
		})

		it('should be inverse of escapeWikiLink', () => {
			const original = 'file|name#heading^block'
			const escaped = escapeWikiLink(original)
			const unescaped = unescapeWikiLink(escaped)
			expect(unescaped).toBe(original)
		})
	})

	describe('needsEscape', () => {
		it('should detect need for escape in value context', () => {
			expect(needsEscape('file|name', 'value')).toBe(true)
			expect(needsEscape('file#heading', 'value')).toBe(true)
			expect(needsEscape('file^block', 'value')).toBe(true)
			expect(needsEscape('path\\file', 'value')).toBe(true)
			expect(needsEscape('normal', 'value')).toBe(false)
		})

		it('should detect need for escape in alias context', () => {
			expect(needsEscape('alias]', 'alias')).toBe(true)
			expect(needsEscape('normal-alias', 'alias')).toBe(false)
		})

		it('should detect need for escape in heading context', () => {
			expect(needsEscape('heading^', 'heading')).toBe(true)
			expect(needsEscape('path\\heading', 'heading')).toBe(true)
			expect(needsEscape('normal-heading', 'heading')).toBe(false)
		})
	})

	describe('escapeMinimal', () => {
		it('should escape only necessary characters for value context', () => {
			expect(escapeMinimal('file|name', 'value')).toBe('file\\|name')
			expect(escapeMinimal('file#heading', 'value')).toBe('file\\#heading')
			expect(escapeMinimal('normal', 'value')).toBe('normal')
		})

		it('should escape only necessary characters for alias context', () => {
			expect(escapeMinimal('alias]', 'alias')).toBe('alias\\]')
			expect(escapeMinimal('normal-alias', 'alias')).toBe('normal-alias')
		})

		it('should escape only necessary characters for heading context', () => {
			expect(escapeMinimal('heading^', 'heading')).toBe('heading\\^')
			expect(escapeMinimal('normal-heading', 'heading')).toBe('normal-heading')
		})

		it('should not escape when not needed', () => {
			expect(escapeMinimal('simple', 'value')).toBe('simple')
			expect(escapeMinimal('simple', 'alias')).toBe('simple')
			expect(escapeMinimal('simple', 'heading')).toBe('simple')
		})
	})
})

describe('tag escape functions', () => {
	describe('escapeTag', () => {
		it('should escape special characters in tag', () => {
			expect(escapeTag('tag name')).toBe('tag\\ name')
			expect(escapeTag('tag#name')).toBe('tag\\#name')
			expect(escapeTag('tag/name')).toBe('tag\\/name')
			expect(escapeTag('tag\\name')).toBe('tag\\\\name')
		})

		it('should handle empty string', () => {
			expect(escapeTag('')).toBe('')
		})

		it('should not modify normal tag', () => {
			expect(escapeTag('normal-tag')).toBe('normal-tag')
			expect(escapeTag('normal_tag')).toBe('normal_tag')
		})
	})

	describe('unescapeTag', () => {
		it('should unescape special characters', () => {
			expect(unescapeTag('tag\\ name')).toBe('tag name')
			expect(unescapeTag('tag\\#name')).toBe('tag#name')
			expect(unescapeTag('tag\\/name')).toBe('tag/name')
			expect(unescapeTag('tag\\\\name')).toBe('tag\\name')
		})

		it('should be inverse of escapeTag', () => {
			const original = 'tag name#value/path\\end'
			const escaped = escapeTag(original)
			const unescaped = unescapeTag(escaped)
			expect(unescaped).toBe(original)
		})
	})
})

describe('highlight escape functions', () => {
	describe('escapeHighlight', () => {
		it('should escape equal signs', () => {
			expect(escapeHighlight('text=value')).toBe('text\\=value')
			expect(escapeHighlight('a==b')).toBe('a\\=\\=b')
		})

		it('should handle empty string', () => {
			expect(escapeHighlight('')).toBe('')
		})

		it('should not modify text without equal signs', () => {
			expect(escapeHighlight('normal text')).toBe('normal text')
		})
	})

	describe('unescapeHighlight', () => {
		it('should unescape equal signs', () => {
			expect(unescapeHighlight('text\\=value')).toBe('text=value')
			expect(unescapeHighlight('a\\=\\=b')).toBe('a==b')
		})

		it('should be inverse of escapeHighlight', () => {
			const original = 'text==value'
			const escaped = escapeHighlight(original)
			const unescaped = unescapeHighlight(escaped)
			expect(unescaped).toBe(original)
		})
	})
})

describe('comment escape functions', () => {
	describe('escapeComment', () => {
		it('should escape percent signs', () => {
			expect(escapeComment('100%')).toBe('100\\%')
			expect(escapeComment('50%%')).toBe('50\\%\\%')
		})

		it('should handle empty string', () => {
			expect(escapeComment('')).toBe('')
		})

		it('should not modify text without percent signs', () => {
			expect(escapeComment('normal text')).toBe('normal text')
		})
	})

	describe('unescapeComment', () => {
		it('should unescape percent signs', () => {
			expect(unescapeComment('100\\%')).toBe('100%')
			expect(unescapeComment('50\\%\\%')).toBe('50%%')
		})

		it('should be inverse of escapeComment', () => {
			const original = '100%% complete'
			const escaped = escapeComment(original)
			const unescaped = unescapeComment(escaped)
			expect(unescaped).toBe(original)
		})
	})
})

describe('callout title escape functions', () => {
	describe('escapeCalloutTitle', () => {
		it('should escape brackets', () => {
			expect(escapeCalloutTitle('title[value]')).toBe('title\\[value\\]')
			expect(escapeCalloutTitle('[note]')).toBe('\\[note\\]')
		})

		it('should handle empty string', () => {
			expect(escapeCalloutTitle('')).toBe('')
		})

		it('should not modify text without brackets', () => {
			expect(escapeCalloutTitle('normal title')).toBe('normal title')
		})
	})

	describe('unescapeCalloutTitle', () => {
		it('should unescape brackets', () => {
			expect(unescapeCalloutTitle('title\\[value\\]')).toBe('title[value]')
			expect(unescapeCalloutTitle('\\[note\\]')).toBe('[note]')
		})

		it('should be inverse of escapeCalloutTitle', () => {
			const original = 'title[value]'
			const escaped = escapeCalloutTitle(original)
			const unescaped = unescapeCalloutTitle(escaped)
			expect(unescaped).toBe(original)
		})
	})
})
