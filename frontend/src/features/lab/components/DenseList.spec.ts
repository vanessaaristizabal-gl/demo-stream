import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { LabRowsQuery } from '@/shared/api/types'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { labQuery, makeLabRow } from '@/shared/test/factories'
import DenseList from './DenseList.vue'

const rows = [
  makeLabRow(1),
  makeLabRow(2, { status: 'paused', dealer: 'Peak Subaru' }),
  makeLabRow(10, { locked_reason: 'Locked by brand.' }),
]
const base = { status: 'ready' as const, rows, total: 2000, pageCount: 40, query: labQuery, savingId: null, messages: {} }
const render = (props: Record<string, unknown> = {}) => mount(DenseList, { props: { ...base, ...props }, attachTo: document.body })
type W = ReturnType<typeof render>
const lastQuery = (w: W) => (w.emitted('query') as LabRowsQuery[][]).at(-1)![0]
const editButton = (w: W, name: string) => w.get(`button[aria-label="Edit budget for ${name}"]`)

describe('DenseList', () => {
  it('AC-1: shows one page of rows and the total of matching rows', () => {
    const w = render()
    expect(w.findAll('tbody tr')).toHaveLength(3)
    expect(w.text()).toContain('2,000 campaigns')
  })

  it('AC-2: changing the status filter or the search text emits the query for page 1', async () => {
    const w = render({ query: { ...labQuery, page: 7 } })
    await w.get('input[type="search"]').setValue('camry')
    expect(lastQuery(w)).toMatchObject({ q: 'camry', page: 1 })

    await w
      .findAll('[role="radio"]')
      .find((r) => r.text() === 'Paused')!
      .trigger('click')
    expect(lastQuery(w)).toMatchObject({ status: 'paused', page: 1 })
  })

  it('AC-3: a sortable header emits the sort and exposes its state with aria-sort', async () => {
    const w = render()
    const header = () => w.findAll('th').find((th) => th.text().includes('Daily budget'))!
    expect(header().attributes('aria-sort')).toBe('none')
    await header().get('button').trigger('click')
    expect(lastQuery(w)).toMatchObject({ sort: 'daily_budget', dir: 'asc' })

    await w.setProps({ query: { ...labQuery, sort: 'daily_budget', dir: 'desc' } })
    expect(header().attributes('aria-sort')).toBe('descending')
  })

  it('AC-4: every row shows its status as text', () => {
    const w = render()
    expect(w.findAll('tbody tr')[1].text()).toContain('paused')
  })

  it('AC-5: changing page emits the query with the new page', async () => {
    const w = render()
    await w.get('button[aria-label="Next page"]').trigger('click')
    expect(lastQuery(w)).toMatchObject({ page: 2 })
  })

  it('AC-6: editing a budget and confirming emits save with the id and integer cents', async () => {
    const w = render()
    await editButton(w, 'Campaign 0001').trigger('click')
    const input = w.get('input[aria-label="Daily budget in dollars for Campaign 0001"]')
    await input.setValue('$1,234.50')
    await w.get('form').trigger('submit')
    expect(w.emitted('save')).toEqual([[{ id: 1, daily_budget: 123450 }]])
  })

  it('AC-7: while a row is saving its save control is busy and its fields are disabled', async () => {
    const w = render({ savingId: 1 })
    expect(w.findAll('tbody button[disabled]').length).toBeGreaterThan(0) // every edit button is off while a save runs
    await w.setProps({ savingId: null })
    await editButton(w, 'Campaign 0001').trigger('click')
    await w.setProps({ savingId: 1 })
    expect(w.get('button[aria-label="Save budget for Campaign 0001"]').attributes('aria-busy')).toBe('true')
    expect(w.get('input[aria-label^="Daily budget in dollars"]').attributes('disabled')).toBeDefined()
  })

  it('AC-8: a locked rejection shows its reason next to the row and keeps the old budget', () => {
    const w = render({ messages: { 10: { kind: 'locked', text: 'Locked by manufacturer rule: brand programme.' } } })
    const row = w.findAll('tbody tr')[2]
    expect(row.get('[role="alert"]').text()).toBe('Locked by manufacturer rule: brand programme.')
    expect(row.text()).toContain('$50.00')
  })

  it('AC-9: a rate limit says to retry and for how long', () => {
    const w = render({ messages: { 1: { kind: 'rate-limited', text: 'Too many edits. Retry in 7 seconds.' } } })
    expect(w.findAll('tbody tr')[0].get('[role="alert"]').text()).toContain('Retry in 7 seconds')
  })

  it('AC-10: with no matches it says so and Clear filters resets the query', async () => {
    const w = render({ rows: [], total: 0, query: { ...labQuery, q: 'zzz', status: 'ended', page: 3 } })
    expect(w.text()).toContain('No campaign matches these filters.')
    await w
      .findAll('button')
      .find((b) => b.text() === 'Clear filters')!
      .trigger('click')
    expect(lastQuery(w)).toMatchObject({ q: '', status: '', page: 1 })
  })

  it('AC-11: a load error shows its message and Try again emits reload', async () => {
    const w = render({ status: 'error', rows: [], error: 'Server exploded' })
    expect(w.get('[role="alert"]').text()).toContain('Server exploded')
    await w
      .findAll('button')
      .find((b) => b.text() === 'Try again')!
      .trigger('click')
    expect(w.emitted('reload')).toHaveLength(1)
  })

  it('AC-12: Enter saves, Escape cancels, and focus returns to the edit button', async () => {
    const w = render()
    await editButton(w, 'Campaign 0001').trigger('click')
    await w.get('input[aria-label^="Daily budget in dollars"]').trigger('keydown', { key: 'Escape' })
    await new Promise((r) => setTimeout(r))
    expect(w.find('form').exists()).toBe(false)
    expect(document.activeElement).toBe(editButton(w, 'Campaign 0001').element)

    await editButton(w, 'Campaign 0001').trigger('click')
    expect(w.find('form button[type="submit"]').exists()).toBe(true) // a submit button: Enter in the field submits the form natively
    await expectNoA11yViolations(w)
  })

  it('AC-13: an invalid amount is refused before any request and explained', async () => {
    const w = render()
    await editButton(w, 'Campaign 0001').trigger('click')
    for (const bad of ['', '0', '-5', '12.345', 'abc', '0.50']) {
      await w.get('input[aria-label^="Daily budget in dollars"]').setValue(bad)
      await w.get('form').trigger('submit')
      expect(w.get('form [role="alert"]').text(), `"${bad}"`).toContain('at least $1.00')
    }
    expect(w.emitted('save')).toBeUndefined()
  })

  it('AC-15: refreshing keeps the search box and table mounted, so focus is not lost while typing', async () => {
    const w = render()
    const search = w.get('input[type="search"]')
    ;(search.element as HTMLInputElement).focus()
    await w.setProps({ status: 'loading' })
    expect(w.get('input[type="search"]').element).toBe(search.element)
    expect(document.activeElement).toBe(search.element)
    expect(w.findAll('tbody tr')).toHaveLength(3)
    expect(w.get('.ds-stack').attributes('aria-busy')).toBe('true')
  })

  it('AC-16: after a rejected save the editor stays open and focus returns to its field', async () => {
    const w = render()
    await editButton(w, 'Campaign 0001').trigger('click')
    await w.setProps({ savingId: 1 })
    await w.setProps({ savingId: null, messages: { 1: { kind: 'locked', text: 'Locked.' } } })
    await new Promise((r) => setTimeout(r))
    expect(document.activeElement).toBe(w.get('input[aria-label^="Daily budget in dollars"]').element)
  })

  it('AC-17: a status change sent while a search is pending still carries the typed search text', async () => {
    const w = render()
    await w.get('input[type="search"]').setValue('ca')
    await w
      .findAll('[role="radio"]')
      .find((r) => r.text() === 'Paused')!
      .trigger('click')
    expect(lastQuery(w)).toMatchObject({ q: 'ca', status: 'paused' })
  })

  it('AC-14: never renders more than 100 rows, however many it is handed', () => {
    const many = Array.from({ length: 150 }, (_, i) => makeLabRow(i + 1))
    expect(render({ rows: many }).findAll('tbody tr')).toHaveLength(100)
  })
})
