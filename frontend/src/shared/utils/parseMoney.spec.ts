import { describe, expect, it } from 'vitest'
import { parseDollarsToCents } from './parseMoney'

describe('parseDollarsToCents', () => {
  it.each([
    ['12.5', 1250],
    ['$1,234.50', 123450],
    ['1', 100],
    [' 20 ', 2000],
  ])('reads %s', (text, cents) => {
    expect(parseDollarsToCents(text)).toBe(cents)
  })
  it.each(['', '0', '0.99', '-5', '12.345', 'abc', '1e3', '1,2,3', '12345678'])('refuses %j', (text) => {
    expect(parseDollarsToCents(text)).toBeNull()
  })
})
