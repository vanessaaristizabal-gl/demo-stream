import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DiffTable from './DiffTable.vue'

describe('DiffTable', () => {
  it('says so when there is nothing to change', () => {
    expect(mount(DiffTable, { props: { diff: {} } }).text()).toContain('No changes')
    expect(mount(DiffTable, { props: { diff: null } }).text()).toContain('No changes')
  })

  it('renders live vs proposed values, with budget formatted as money', () => {
    const w = mount(DiffTable, { props: { diff: { daily_budget: { old: 10000, new: 12500 }, status: { old: 'active', new: 'paused' } } } })

    expect(w.findAll('tbody tr').map((r) => r.findAll('td').map((td) => td.text()))).toEqual([
      ['Daily budget', '$100.00', '$125.00'],
      ['Status', 'active', 'paused'],
    ])
  })

  it('is a table named for what it shows', () => {
    const w = mount(DiffTable, { props: { diff: { status: { old: 'active', new: 'paused' } } } })

    expect(w.get('caption').text()).toBe('Proposed changes')
  })
})
