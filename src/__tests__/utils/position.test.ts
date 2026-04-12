import { describe, it, expect } from 'vitest'
import {
	createPoint,
	createPosition,
	offsetToPosition,
	positionToOffset,
	getPositionRange
} from '../../utils/position'

describe('position utilities', () => {
	describe('createPoint', () => {
		it('should create a point with correct values', () => {
			const point = createPoint(1, 5, 4)
			expect(point).toEqual({
				line: 1,
				column: 5,
				offset: 4
			})
		})

		it('should handle zero values', () => {
			const point = createPoint(0, 0, 0)
			expect(point).toEqual({
				line: 0,
				column: 0,
				offset: 0
			})
		})

		it('should handle large values', () => {
			const point = createPoint(1000, 500, 50000)
			expect(point.line).toBe(1000)
			expect(point.column).toBe(500)
			expect(point.offset).toBe(50000)
		})
	})

	describe('createPosition', () => {
		it('should create a position with start and end points', () => {
			const position = createPosition(1, 1, 0, 1, 10, 9)
			expect(position).toEqual({
				start: { line: 1, column: 1, offset: 0 },
				end: { line: 1, column: 10, offset: 9 }
			})
		})

		it('should handle multi-line position', () => {
			const position = createPosition(1, 1, 0, 3, 5, 20)
			expect(position.start.line).toBe(1)
			expect(position.end.line).toBe(3)
		})

		it('should handle single character position', () => {
			const position = createPosition(1, 5, 4, 1, 6, 5)
			expect(position.start.column).toBe(5)
			expect(position.end.column).toBe(6)
		})
	})

	describe('offsetToPosition', () => {
		it('should convert offset to position for single line', () => {
			const text = 'hello world'
			const point = offsetToPosition(text, 6)
			expect(point.line).toBe(1)
			expect(point.column).toBe(7)
			expect(point.offset).toBe(6)
		})

		it('should handle offset 0', () => {
			const text = 'hello world'
			const point = offsetToPosition(text, 0)
			expect(point.line).toBe(1)
			expect(point.column).toBe(1)
			expect(point.offset).toBe(0)
		})

		it('should handle multi-line text', () => {
			const text = 'line1\nline2\nline3'
			const point = offsetToPosition(text, 7)
			expect(point.line).toBe(2)
			expect(point.column).toBe(2)
			expect(point.offset).toBe(7)
		})

		it('should handle offset at line start', () => {
			const text = 'line1\nline2\nline3'
			const point = offsetToPosition(text, 6)
			expect(point.line).toBe(2)
			expect(point.column).toBe(1)
			expect(point.offset).toBe(6)
		})

		it('should handle offset at end of text', () => {
			const text = 'hello'
			const point = offsetToPosition(text, 5)
			expect(point.line).toBe(1)
			expect(point.column).toBe(6)
			expect(point.offset).toBe(5)
		})

		it('should handle empty text', () => {
			const point = offsetToPosition('', 0)
			expect(point.line).toBe(1)
			expect(point.column).toBe(1)
			expect(point.offset).toBe(0)
		})

		it('should handle CRLF line endings', () => {
			const text = 'line1\r\nline2'
			const point = offsetToPosition(text, 7)
			expect(point.line).toBe(2)
			expect(point.column).toBe(1)
		})
	})

	describe('positionToOffset', () => {
		it('should convert position to offset for single line', () => {
			const text = 'hello world'
			const offset = positionToOffset(text, 1, 7)
			expect(offset).toBe(6)
		})

		it('should handle position at start', () => {
			const text = 'hello world'
			const offset = positionToOffset(text, 1, 1)
			expect(offset).toBe(0)
		})

		it('should handle multi-line text', () => {
			const text = 'line1\nline2\nline3'
			const offset = positionToOffset(text, 2, 2)
			expect(offset).toBe(7)
		})

		it('should handle position at line start', () => {
			const text = 'line1\nline2\nline3'
			const offset = positionToOffset(text, 2, 1)
			expect(offset).toBe(6)
		})

		it('should handle position beyond text length', () => {
			const text = 'hello'
			const offset = positionToOffset(text, 1, 100)
			expect(offset).toBe(5)
		})

		it('should handle line beyond text lines', () => {
			const text = 'hello'
			const offset = positionToOffset(text, 10, 1)
			expect(offset).toBe(5)
		})
	})

	describe('getPositionRange', () => {
		it('should get position range for single line', () => {
			const text = 'hello world'
			const position = getPositionRange(text, 0, 5)
			expect(position.start.line).toBe(1)
			expect(position.start.column).toBe(1)
			expect(position.end.line).toBe(1)
			expect(position.end.column).toBe(6)
		})

		it('should get position range for multi-line', () => {
			const text = 'line1\nline2\nline3'
			const position = getPositionRange(text, 0, 12)
			expect(position.start.line).toBe(1)
			expect(position.end.line).toBe(3)
			expect(position.end.column).toBe(1)
		})

		it('should handle range at end of text', () => {
			const text = 'hello'
			const position = getPositionRange(text, 3, 5)
			expect(position.start.column).toBe(4)
			expect(position.end.column).toBe(6)
		})

		it('should handle same start and end offset', () => {
			const text = 'hello'
			const position = getPositionRange(text, 2, 2)
			expect(position.start).toEqual(position.end)
		})
	})

	describe('round-trip conversion', () => {
		it('should be consistent for single line', () => {
			const text = 'hello world'
			for (let i = 0; i < text.length; i++) {
				const point = offsetToPosition(text, i)
				const offset = positionToOffset(text, point.line, point.column)
				expect(offset).toBe(i)
			}
		})

		it('should be consistent for multi-line', () => {
			const text = 'line1\nline2\nline3\nline4'
			const testOffsets = [0, 3, 5, 6, 10, 12, 18, 20]
			for (const originalOffset of testOffsets) {
				const point = offsetToPosition(text, originalOffset)
				const offset = positionToOffset(text, point.line, point.column)
				expect(offset).toBe(originalOffset)
			}
		})
	})
})
