/*
 * The ONLY place that decides how data is shown to people (see .claude/rules/dates-and-formats.md).
 * ESLint forbids toLocale*String elsewhere. The API sends ISO 8601 dates and money in cents.
 */
const LOCALE = 'en-US'

// Intl formatters are costly to build, and tables format many cells: build one per style and time zone.
const cache = new Map<string, Intl.DateTimeFormat>()
const formatter = (kind: 'date' | 'datetime' | 'long', timeZone?: string): Intl.DateTimeFormat => {
  const key = `${kind}|${timeZone ?? ''}`
  let f = cache.get(key)
  if (!f) {
    const style = {
      date: { dateStyle: 'medium' },
      datetime: { dateStyle: 'medium', timeStyle: 'short' },
      long: { dateStyle: 'long', timeStyle: 'long' },
    }[kind] as Intl.DateTimeFormatOptions
    f = new Intl.DateTimeFormat(LOCALE, { ...style, timeZone })
    cache.set(key, f)
  }
  return f
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

const parse = (iso: string | null | undefined): Date | null => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "Oct 15, 2026". Shown in the viewer's time zone unless one is given. A bare date (2026-10-15) has no time, so it is never shifted by a time zone. */
export function formatDate(iso: string | null | undefined, timeZone?: string): string {
  const d = parse(iso)
  if (!d) return '—'
  return formatter('date', iso && DATE_ONLY.test(iso) ? 'UTC' : timeZone).format(d)
}

/** "Oct 15, 2026, 4:07 PM", in the viewer's time zone unless one is given. */
export function formatDateTime(iso: string | null | undefined, timeZone?: string): string {
  const d = parse(iso)
  return d ? formatter('datetime', timeZone).format(d) : '—'
}

/** "October 15, 2026 at 4:07:03 PM UTC": the unambiguous form (names the time zone), used as a tooltip. */
export function formatDateTimeLong(iso: string | null | undefined, timeZone?: string): string {
  const d = parse(iso)
  return d ? formatter('long', timeZone).format(d) : '—'
}

/** Sort key for a date column. Missing or invalid dates sort last (null). */
export function dateSortKey(iso: string | null | undefined): number | null {
  return parse(iso)?.getTime() ?? null
}

export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return '—'
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'USD' }).format(cents / 100)
}

/** A whole number with thousands separators: "12,345". */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(value)
}

/** A fraction as a percentage: 0.0452 gives "4.52%". */
export function formatPercent(fraction: number | null | undefined): string {
  if (fraction == null) return '—'
  return new Intl.NumberFormat(LOCALE, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(fraction)
}

export function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (field === 'daily_budget' && typeof value === 'number') return formatMoney(value)
  return String(value)
}

export const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  status: 'Status',
  daily_budget: 'Daily budget',
}
