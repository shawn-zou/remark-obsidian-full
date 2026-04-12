export interface Point {
  line: number
  column: number
  offset: number
}

export interface Position {
  start: Point
  end: Point
}

export function createPoint(line: number, column: number, offset: number): Point {
  return { line, column, offset }
}

export function createPosition(
  startLine: number,
  startColumn: number,
  startOffset: number,
  endLine: number,
  endColumn: number,
  endOffset: number
): Position {
  return {
    start: createPoint(startLine, startColumn, startOffset),
    end: createPoint(endLine, endColumn, endOffset)
  }
}

export function offsetToPosition(text: string, offset: number): Point {
  let line = 1
  let column = 1
  let currentOffset = 0

  for (const char of text) {
    if (currentOffset === offset) {
      break
    }

    if (char === '\n') {
      line++
      column = 1
    } else {
      column++
    }
    currentOffset++
  }

  return { line, column, offset }
}

export function positionToOffset(text: string, line: number, column: number): number {
  let currentLine = 1
  let currentColumn = 1
  let offset = 0

  for (const char of text) {
    if (currentLine === line && currentColumn === column) {
      return offset
    }

    if (char === '\n') {
      currentLine++
      currentColumn = 1
    } else {
      currentColumn++
    }
    offset++
  }

  return offset
}

export function getPositionRange(
  text: string,
  startOffset: number,
  endOffset: number
): Position {
  return {
    start: offsetToPosition(text, startOffset),
    end: offsetToPosition(text, endOffset)
  }
}
