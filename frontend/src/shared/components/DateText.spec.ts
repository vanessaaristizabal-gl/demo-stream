import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { formatDate, formatDateTime } from '@/shared/utils/format'
import DateText from './DateText.vue'

const ISO = '2026-10-15T16:07:03+00:00'

describe('DateText', () => {
  it('renders a semantic <time> with the machine-readable value and the shared date format', () => {
    const w = mount(DateText, { props: { value: ISO } })

    expect(w.element.tagName).toBe('TIME')
    expect(w.attributes('datetime')).toBe(ISO)
    expect(w.text()).toBe(formatDate(ISO))
  })

  it('can show the time as well', () => {
    expect(mount(DateText, { props: { value: ISO, mode: 'datetime' } }).text()).toBe(formatDateTime(ISO))
  })

  it('adds a time-zone-explicit tooltip', () => {
    expect(mount(DateText, { props: { value: ISO } }).attributes('title')).toContain('October 15, 2026')
  })

  it.each([null, undefined, 'garbage'])('shows a dash, not a <time>, for %s', (value) => {
    const w = mount(DateText, { props: { value } })

    expect(w.text()).toBe('—')
    expect(w.find('time').exists()).toBe(false)
  })
})
