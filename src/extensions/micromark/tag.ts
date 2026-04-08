import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'

import { TagOptions } from './types'

const TAG_BOUNDARY_PUNCTUATION = [codes.exclamationMark, codes.questionMark, codes.semicolon, codes.colon, codes.comma]

const TAG_VALID_CHARS = /^[a-zA-Z0-9_\-\u4e00-\u9fff/\.]+$/

export function isValidTag(tag: string): boolean {
  if (!tag || tag.length === 0) return false
  if (/^\d+$/.test(tag)) return false
  if (tag.startsWith('/')) return false
  return TAG_VALID_CHARS.test(tag)
}

export function tag(options?: TagOptions): Extension {
  const allowNested = options?.allowNested ?? true
  const tokenize: Tokenizer = function(effects, ok, nok) {
    let size = 0
    let hasContent = false

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.numberSign) return nok(code)
      effects.enter('tag')
      effects.enter('tagMarker')
      effects.consume(code)
      effects.exit('tagMarker')
      effects.enter('tagValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) {
        if (!hasContent) return nok(code)
        return end(code)
      }
      if (code === codes.space) {
        if (!hasContent) return nok(code)
        return end(code)
      }
      if (code === codes.leftParenthesis ||
        code === codes.rightParenthesis ||
        code === codes.leftSquareBracket ||
        code === codes.rightSquareBracket ||
        code === codes.leftCurlyBrace ||
        code === codes.rightCurlyBrace ||
        code === codes.lessThan ||
        code === codes.greaterThan ||
        code === codes.quotationMark ||
        code === codes.apostrophe
      ) {
        if (!hasContent) return nok(code)
        return end(code)
      }
      if (code === codes.numberSign) {
        if (!hasContent) return nok(code)
        return end(code)
      }
      if (TAG_BOUNDARY_PUNCTUATION.includes(code)) {
        if (!hasContent) return nok(code)
        return end(code)
      }
      if (code === codes.backslash) {
        effects.consume(code)
        return escape
      }
      if (allowNested && code === codes.slash) {
        if (size === 0) return nok(code)
        effects.consume(code)
        return data
      }
      if (code === codes.dot) {
        hasContent = true
        size++
        effects.consume(code)
        return data
      }
      hasContent = true
      size++
      effects.consume(code)
      return data
    }

    function escape(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      hasContent = true
      size++
      effects.consume(code)
      return data
    }

    function end(code: Code): State | undefined {
      if (!hasContent) return nok(code)
      effects.exit('tagValue')
      effects.exit('tag')
      return ok(code)
    }
  }

  return {
    text: {
      [codes.numberSign]: {
        name: 'tag',
        tokenize
      }
    }
  }
}

export function parseTagValue(value: string): {
  value: string
  nested: string[]
} {
  let cleanValue = value.replace(/\.$/, '')
  const parts = cleanValue.split('/')
  return {
    value: cleanValue,
    nested: parts
  }
}