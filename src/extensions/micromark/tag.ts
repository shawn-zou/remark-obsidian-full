import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'

export interface TagOptions {
  allowNested?: boolean
}

export function tag(options?: TagOptions): Extension {
  const allowNested = options?.allowNested ?? true

  const tokenize: Tokenizer = function(effects, ok, nok) {
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
        return end(code)
      }

      if (
        code === codes.space ||
        code === codes.tab ||
        code === codes.carriageReturn ||
        code === codes.lineFeed
      ) {
        return end(code)
      }

      if (
        code === codes.leftParenthesis ||
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
        return nok(code)
      }

      if (code === codes.numberSign) {
        return nok(code)
      }

      if (allowNested && code === codes.slash) {
        effects.consume(code)
        return data
      }

      effects.consume(code)
      return data
    }

    function end(code: Code): State | undefined {
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
  const parts = value.split('/')
  return {
    value: value,
    nested: parts
  }
}

const TAG_VALID_CHARS = /^[a-zA-Z0-9_\-\u4e00-\u9fff/]+$/

export function isValidTag(tag: string): boolean {
  if (!tag || tag.length === 0) return false
  if (/^\d+$/.test(tag)) return false
  return TAG_VALID_CHARS.test(tag)
}
