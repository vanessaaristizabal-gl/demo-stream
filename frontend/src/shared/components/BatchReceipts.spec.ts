import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { makeReceipt } from '@/shared/test/factories'
import BatchReceipts from './BatchReceipts.vue'

describe('BatchReceipts', () => {
  it('lists each write with the item, who made it, what, the governed path and the date', () => {
    const w = mount(BatchReceipts, { props: { receipts: [makeReceipt(1), makeReceipt(2, { label: 'Best CDJR' })] } })
    expect(w.get('h2').text()).toBe('Changelog receipts (2)')
    const rows = w.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Schrute CDJR')
    expect(rows[0].text()).toContain('Demo strategist')
    expect(rows[0].text()).toContain('validated > compliance > dry-run > write')
    expect(rows[0].text()).toContain('Oct 20, 2026')
  })

  it('renders server text as text, never as HTML', () => {
    const w = mount(BatchReceipts, { props: { receipts: [makeReceipt(1, { summary: '<b>bold</b>' })] } })
    expect(w.find('b').exists()).toBe(false)
    expect(w.text()).toContain('<b>bold</b>')
  })

  it('shows nothing without receipts, and says so when they could not be loaded', () => {
    expect(mount(BatchReceipts, { props: { receipts: [] } }).html()).toBe('<!--v-if-->')
    expect(
      mount(BatchReceipts, { props: { receipts: [], error: 'Receipts are down' } })
        .get('[role="status"]')
        .text(),
    ).toBe('Receipts are down')
  })
})
