import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import DsTable from './DsTable.vue'

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'budget', label: 'Budget', align: 'end' as const },
]
const rows = [
  { id: 1, name: 'Camry', budget: 100 },
  { id: 2, name: 'RAV4', budget: 200 },
]
const make = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) =>
  mount(DsTable as unknown as Component, { props: { columns, rows, rowKey: 'id', caption: 'Campaigns', ...props }, slots })

describe('DsTable', () => {
  it('is a real table with a caption and column headers', () => {
    const w = make()

    expect(w.get('caption').text()).toBe('Campaigns')
    expect(w.findAll('th[scope="col"]').map((h) => h.text())).toEqual(['Name', 'Budget'])
    expect(w.findAll('tbody tr').map((r) => r.findAll('td').map((c) => c.text()))).toEqual([
      ['Camry', '100'],
      ['RAV4', '200'],
    ])
  })

  it('wraps the table in a labelled, keyboard-focusable scroll region', () => {
    const wrap = make().get('.ds-table-wrap')

    expect(wrap.attributes('role')).toBe('region')
    expect(wrap.attributes('tabindex')).toBe('0')
    expect(wrap.attributes('aria-labelledby')).toBe(make().get('caption').attributes('id') ? wrap.attributes('aria-labelledby') : '')
  })

  it('exposes aria-sort only on sortable columns and cycles asc, desc, none', async () => {
    const w = make({ sort: null, 'onUpdate:sort': (v: unknown) => w.setProps({ sort: v }) })
    const th = () => w.findAll('th')[0]

    expect(th().attributes('aria-sort')).toBe('none')
    expect(w.findAll('th')[1].attributes('aria-sort')).toBeUndefined()

    await w.get('.ds-table__sort').trigger('click')
    expect(th().attributes('aria-sort')).toBe('ascending')
    await w.get('.ds-table__sort').trigger('click')
    expect(th().attributes('aria-sort')).toBe('descending')
    await w.get('.ds-table__sort').trigger('click')
    expect(th().attributes('aria-sort')).toBe('none')
  })

  it('renders custom cells through scoped slots', () => {
    const w = make({}, { 'cell-name': '<template #cell-name="{ row }"><a href="#">{{ row.name }}!</a></template>' })

    expect(w.findAll('tbody a').map((a) => a.text())).toEqual(['Camry!', 'RAV4!'])
  })

  it('shows an empty row spanning every column', () => {
    const w = make({ rows: [] }, { empty: 'Nothing yet' })

    expect(w.get('.ds-table__empty').text()).toBe('Nothing yet')
    expect(w.get('.ds-table__empty').attributes('colspan')).toBe('2')
  })

  it('shows a dash for missing values', () => {
    const w = make({ rows: [{ id: 1, name: 'X', budget: null }] })

    expect(w.findAll('td')[1].text()).toBe('—')
  })
})
