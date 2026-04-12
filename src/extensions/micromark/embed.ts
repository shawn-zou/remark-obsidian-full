import type { Extension, Tokenizer, State, Code } from 'micromark-util-types'
import { codes } from 'micromark-util-symbol'
import { unescapeWikiLink } from '../../utils/escape'

export interface EmbedOptions {
  aliasDivider?: string
}

export function embed(options?: EmbedOptions): Extension {
  const aliasDivider = options?.aliasDivider ?? '|'

  const tokenize: Tokenizer = function(effects, ok, nok) {
    let size = 0
    let hasHeading = false
    let hasBlockId = false
    let headingSize = 0
    let blockIdSize = 0

    return start

    function start(code: Code): State | undefined {
      if (code !== codes.exclamationMark) return nok(code)
      effects.enter('embed')
      effects.enter('embedMarker')
      effects.consume(code)
      return open
    }

    function open(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) {
        effects.exit('embedMarker')
        return nok(code)
      }
      effects.consume(code)
      return openBracket
    }

    function openBracket(code: Code): State | undefined {
      if (code !== codes.leftSquareBracket) {
        effects.exit('embedMarker')
        return nok(code)
      }
      effects.consume(code)
      effects.exit('embedMarker')
      effects.enter('embedValue')
      return data
    }

    function data(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      
      if (code === codes.rightSquareBracket) {
        if (size === 0) return nok(code)
        return close(code)
      }

      if (code === codes.backslash) {
        effects.consume(code)
        return escape
      }

      if (code === codes.numberSign) {
        hasHeading = true
        effects.consume(code)
        return headingStart
      }

      size++
      effects.consume(code)
      return data
    }

    function escape(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      size++
      effects.consume(code)
      return data
    }

    function close(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.exit('embedValue')
      effects.enter('embedMarker')
      effects.consume(code)
      return closeEnd
    }

    function closeEnd(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.consume(code)
      effects.exit('embedMarker')
      effects.exit('embed')
      return ok(code)
    }

    function headingStart(code: Code): State | undefined {
      if (code === codes.caret) {
        hasBlockId = true
        effects.consume(code)
        return blockId
      }
      if (code === codes.rightSquareBracket) {
        return nok(code)
      }
      if (code === codes.backslash) {
        effects.consume(code)
        return headingEscape
      }
      headingSize++
      effects.consume(code)
      return heading
    }

    function heading(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
        if (headingSize === 0) return nok(code)
        return close(code)
      }
      if (code === codes.backslash) {
        effects.consume(code)
        return headingEscape
      }
      if (code === aliasDivider.charCodeAt(0)) {
        if (headingSize === 0) return nok(code)
        effects.consume(code)
        return afterDivider
      }
      headingSize++
      effects.consume(code)
      return heading
    }

    function headingEscape(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      headingSize++
      effects.consume(code)
      return heading
    }

    function blockId(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
        if (blockIdSize === 0) return nok(code)
        return close(code)
      }
      if (code === aliasDivider.charCodeAt(0)) {
        if (blockIdSize === 0) return nok(code)
        effects.consume(code)
        return afterDivider
      }
      if (code === codes.backslash) {
        effects.consume(code)
        return blockIdEscape
      }
      blockIdSize++
      effects.consume(code)
      return blockId
    }

    function blockIdEscape(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      blockIdSize++
      effects.consume(code)
      return blockId
    }

    function afterDivider(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      if (code === codes.rightSquareBracket) {
        return close(code)
      }
      if (code === codes.backslash) {
        effects.consume(code)
        return afterDividerEscape
      }
      effects.consume(code)
      return afterDivider
    }

    function afterDividerEscape(code: Code): State | undefined {
      if (code === codes.eof) return nok(code)
      effects.consume(code)
      return afterDivider
    }

    function close(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.exit('embedValue')
      effects.enter('embedMarker')
      effects.consume(code)
      return closeEnd
    }

    function closeEnd(code: Code): State | undefined {
      if (code !== codes.rightSquareBracket) return nok(code)
      effects.consume(code)
      effects.exit('embedMarker')
      effects.exit('embed')
      return ok(code)
    }
  }

  return {
    text: {
      [codes.exclamationMark]: {
        name: 'embed',
        tokenize
      }
    }
  }
}

export function parseEmbedValue(value: string, aliasDivider: string = '|'): {
  value: string
  heading?: string
  blockId?: string
  width?: number
  height?: number
  raw: { value: string }
} {
  let heading: string | undefined
  let blockId: string | undefined
  let width: number | undefined
  let height: number | undefined

  // 首先处理原始值，不进行 unescape，以便正确识别转义的 #
  let mainValue = value
  
  // 找到所有 | 分隔符
  const pipeIndices: number[] = []
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '|') {
      pipeIndices.push(i)
    }
  }
  
  // 从前往后检查是否有尺寸部分
  for (let i = 0; i < pipeIndices.length; i++) {
    const pipeIndex = pipeIndices[i]
    // 检查下一个 | 之前的内容是否是尺寸
    const nextPipeIndex = pipeIndices[i + 1] || value.length
    const sizePart = value.slice(pipeIndex + 1, nextPipeIndex)
    const sizeMatch = sizePart.match(/^\s*(\d+)(?:x(\d+))?\s*$/)
    if (sizeMatch) {
      width = parseInt(sizeMatch[1], 10)
      if (sizeMatch[2]) {
        height = parseInt(sizeMatch[2], 10)
      }
      // 重建 mainValue，移除尺寸部分
      mainValue = value.slice(0, pipeIndex) + value.slice(nextPipeIndex)
      break
    }
  }

  // 现在处理 mainValue 中的 blockId 和 heading
  let lastHashIndex = -1
  
  // 找到最后一个未被转义的 #
  for (let i = mainValue.length - 1; i >= 0; i--) {
    if (mainValue[i] === '#' && (i === 0 || mainValue[i - 1] !== '\\')) {
      lastHashIndex = i
      break
    }
  }
  
  let actualValue = mainValue
  
  if (lastHashIndex !== -1) {
    // 检查是否是 blockId
    if (lastHashIndex + 1 < mainValue.length && mainValue[lastHashIndex + 1] === '^') {
      const blockIdMatch = mainValue.slice(lastHashIndex).match(/^#\^([a-zA-Z0-9\-]+)$/)
      if (blockIdMatch) {
        blockId = blockIdMatch[1]
        actualValue = mainValue.slice(0, lastHashIndex)
      }
    } else {
      // 检查是否是 heading
      const headingMatch = mainValue.slice(lastHashIndex).match(/^#([^#]+)$/)
      if (headingMatch) {
        heading = headingMatch[1]
        actualValue = mainValue.slice(0, lastHashIndex)
      }
    }
  }

  // 最后对各个部分进行 unescape 处理
  return {
    value: unescapeWikiLink(actualValue),
    heading: heading ? unescapeWikiLink(heading) : undefined,
    blockId: blockId,
    width: width,
    height: height,
    raw: { value: value }
  }
}
