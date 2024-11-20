import { describe, expect, it } from '@jest/globals'

import { isFalsy } from '../src/utils'

describe('isFalsy Utility Function', () => {
	it('should return true for null', () => {
		expect(isFalsy('null')).toBe(true)
	})

	it('should return true for undefined', () => {
		expect(isFalsy('undefined')).toBe(true)
	})

	it('should return true for false', () => {
		expect(isFalsy('false')).toBe(true)
	})

	it('should return true for 0', () => {
		expect(isFalsy('0')).toBe(true)
	})

	it('should return true for an empty string', () => {
		expect(isFalsy('')).toBe(true)
	})

	it('should return false for non-falsy values', () => {
		expect(isFalsy('1')).toBe(false)
		expect(isFalsy('non-empty string')).toBe(false)
		expect(isFalsy('true')).toBe(false)
	})
})
