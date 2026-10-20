import { describe, expect, it } from 'vitest'
import {
  dateSortKey,
  formatDate,
  formatDateTime,
  formatDateTimeLong,
  formatMoney,
  formatNumber,
  formatPercent,
  formatValue,
} from './format'

const ISO = '2026-10-15T16:07:03+00:00'

describe('money', () => {
  it('formats cents as dollars', () => {
    expect(formatMoney(12345)).toBe('$123.45')
    expect(formatMoney(0)).toBe('$0.00')
    expect(formatMoney(null)).toBe('—')
  })

  it('formats budget fields as money and others as text', () => {
    expect(formatValue('daily_budget', 5000)).toBe('$50.00')
    expect(formatValue('status', 'paused')).toBe('paused')
    expect(formatValue('name', undefined)).toBe('—')
  })
})

describe('numbers and percentages', () => {
  it('groups thousands and keeps at most two decimals', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
    expect(formatNumber(12.345)).toBe('12.35')
    expect(formatNumber(null)).toBe('—')
  })

  it('shows a fraction as a percentage with two decimals', () => {
    expect(formatPercent(0.0452)).toBe('4.52%')
    expect(formatPercent(0)).toBe('0.00%')
    expect(formatPercent(undefined)).toBe('—')
  })
})

describe('dates', () => {
  it('formats a date as "Oct 15, 2026"', () => {
    expect(formatDate(ISO, 'UTC')).toBe('Oct 15, 2026')
  })

  it('formats a date and time as "Oct 15, 2026, 4:07 PM"', () => {
    expect(formatDateTime(ISO, 'UTC').replace(/ /g, ' ')).toBe('Oct 15, 2026, 4:07 PM')
  })

  it('has an unambiguous long form that names the time zone', () => {
    expect(formatDateTimeLong(ISO, 'UTC')).toContain('October 15, 2026')
    expect(formatDateTimeLong(ISO, 'UTC')).toContain('UTC')
  })

  it('shows the same instant in the viewer time zone', () => {
    expect(formatDate('2026-10-15T23:30:00+00:00', 'Asia/Tokyo')).toBe('Oct 16, 2026')
    expect(formatDate('2026-10-15T23:30:00+00:00', 'America/Los_Angeles')).toBe('Oct 15, 2026')
  })

  it('honours the offset in the ISO string', () => {
    expect(formatDate('2026-10-15T23:30:00-05:00', 'UTC')).toBe('Oct 16, 2026')
  })

  it('does not shift a bare date by the viewer time zone (no time means no conversion)', () => {
    expect(formatDate('2026-10-15', 'America/Los_Angeles')).toBe('Oct 15, 2026')
    expect(formatDate('2026-10-15', 'Asia/Tokyo')).toBe('Oct 15, 2026')
    expect(formatDate('2026-10-15')).toBe('Oct 15, 2026')
  })

  it('formats repeatedly and consistently (formatters are cached per style and zone)', () => {
    expect(formatDate(ISO, 'UTC')).toBe(formatDate(ISO, 'UTC'))
    expect(formatDate('2026-10-15T23:30:00+00:00', 'UTC')).toBe('Oct 15, 2026')
    expect(formatDate('2026-10-15T23:30:00+00:00', 'Asia/Tokyo')).toBe('Oct 16, 2026') // a different zone is not served from the UTC cache
  })

  it.each([null, undefined, '', 'not a date'])('shows a dash for %s instead of "Invalid Date"', (v) => {
    expect(formatDate(v)).toBe('—')
    expect(formatDateTime(v)).toBe('—')
    expect(formatDateTimeLong(v)).toBe('—')
  })

  it('gives a numeric sort key, with missing dates as null so they sort last', () => {
    expect(dateSortKey(ISO)).toBe(Date.parse(ISO))
    expect(dateSortKey(null)).toBeNull()
    expect(dateSortKey('nope')).toBeNull()
    expect(dateSortKey('2026-01-01T00:00:00Z')! < dateSortKey('2026-02-01T00:00:00Z')!).toBe(true)
  })
})
