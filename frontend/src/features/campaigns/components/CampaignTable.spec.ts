import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { expectNoA11yViolations } from '@/shared/test/axe'
import type { CampaignRow } from '../rows'
import CampaignTable from './CampaignTable.vue'

const row = (id: number, overrides: Partial<CampaignRow> = {}): CampaignRow => ({
  key: `live-${id}`,
  kind: 'live',
  id,
  name: 'Spring Camry',
  provider: 'google',
  owner: 'Acme Motors',
  accountId: 12,
  status: 'active',
  daily_budget: 10000,
  created_at: '2026-10-01T14:30:00+00:00',
  ...overrides,
})
const rows = [
  row(5),
  row(6, {
    key: 'simulated-6',
    kind: 'simulated',
    name: 'Another',
    owner: 'Demo sandbox',
    accountId: null,
    status: 'paused',
    daily_budget: 25000,
    created_at: '2026-12-24T09:00:00+00:00',
  }),
  row(7, { name: 'Zebra Lease', daily_budget: 5000, created_at: '2026-03-02T09:00:00+00:00' }),
]
// The campaign name is the first link of each row (the account is the second).
const names = (w: ReturnType<typeof mount>) => w.findAll('tbody tr').flatMap((r) => (r.find('a') ? [r.get('a').text()] : []))
const make = (r = rows) => mount(CampaignTable, { props: { rows: r }, attachTo: document.body })

describe('CampaignTable', () => {
  it('shows an empty state when there are no campaigns', () => {
    expect(make([]).text()).toContain('No campaigns yet')
  })

  it('lists live and simulated campaigns with their source, formatted budget and status', () => {
    const w = make()
    expect(names(w)).toEqual(['Another', 'Spring Camry', 'Zebra Lease'])
    expect(w.text()).toContain('$250.00')
    expect(w.text()).toContain('paused')
    expect(w.findAll('tbody tr').map((r) => r.text().match(/Live|Simulated/)?.[0])).toEqual(['Simulated', 'Live', 'Live'])
  })

  it('emits open with the row when a name is clicked', async () => {
    const w = make()
    await w
      .findAll('a')
      .find((a) => a.text() === 'Spring Camry')!
      .trigger('click')
    expect(w.emitted('open')).toEqual([[rows[0]]])
  })

  it('a live campaign offers a change request and no delete; a simulated one offers edit and delete', async () => {
    const w = make()
    expect(w.find('button[aria-label="Request a change to Spring Camry"]').exists()).toBe(true)
    expect(w.find('button[aria-label="Delete Spring Camry"]').exists()).toBe(false)
    expect(w.find('button[aria-label="Edit Spring Camry"]').exists()).toBe(false)

    await w.get('button[aria-label="Edit Another"]').trigger('click')
    await w.get('button[aria-label="Delete Another"]').trigger('click')
    await w.get('button[aria-label="Request a change to Zebra Lease"]').trigger('click')
    expect(w.emitted('edit')).toEqual([[rows[1]], [rows[2]]])
    expect(w.emitted('remove')).toEqual([[rows[1]]])
  })

  it('filters rows with the search box (also by source) and explains when nothing matches', async () => {
    const w = make()
    const search = w.get('input[type="search"]')
    await search.setValue('camry')
    expect(names(w)).toEqual(['Spring Camry'])
    await search.setValue('simulated')
    expect(names(w)).toEqual(['Another'])
    await search.setValue('nothing like this')
    expect(w.text()).toContain('No campaigns match these filters')
  })

  it('sorts by budget when its header is activated, and exposes the state to assistive tech', async () => {
    const w = make()
    const header = () => w.findAll('th').find((th) => th.text().includes('Daily budget'))!
    await header().get('button').trigger('click')
    expect(header().attributes('aria-sort')).toBe('ascending')
    expect(names(w)).toEqual(['Zebra Lease', 'Spring Camry', 'Another'])
  })

  it('shows each creation date as a semantic <time> in the shared format', () => {
    const cell = make().findAll('tbody tr')[1].find('time')
    expect(cell.attributes('datetime')).toBe('2026-10-01T14:30:00+00:00')
    expect(cell.text()).toBe('Oct 1, 2026')
  })

  it('filters by status, with counts, and combines with the search', async () => {
    const limited = row(8, { key: 'live-8', name: 'Limited by budget', status: 'limited' })
    const ended = row(9, { key: 'live-9', name: 'Fall clearance', status: 'ended' })
    const w = make([...rows, limited, ended])
    expect(w.findAll('[role="radio"]').map((r) => r.text())).toEqual(['All (5)', 'Active (2)', 'Paused (1)', 'Limited (1)', 'Ended (1)'])

    const pick = async (label: RegExp) => {
      await w
        .findAll('[role="radio"]')
        .find((r) => label.test(r.text()))!
        .trigger('click')
      await flushPromises()
    }
    await pick(/^Limited/)
    expect(names(w)).toEqual(['Limited by budget'])
    await pick(/^Ended/)
    expect(names(w)).toEqual(['Fall clearance'])
    await pick(/^Active/)
    await w.get('input[type="search"]').setValue('zebra')
    expect(names(w)).toEqual(['Zebra Lease'])
    await pick(/^Paused/)
    expect(w.text()).toContain('No campaigns match these filters')
  })

  it('links the account of a live campaign to its page and shows no link for a simulated one', async () => {
    const w = make()
    await w
      .findAll('a')
      .find((a) => a.text() === 'Acme Motors')!
      .trigger('click')
    expect(w.emitted('account')).toEqual([[12]])
    const simulated = w.findAll('tbody tr').find((r) => r.text().includes('Another'))!
    expect(simulated.findAll('a').map((a) => a.text())).toEqual(['Another'])
    expect(simulated.text()).toContain('Demo sandbox')
  })

  it('has no automatable accessibility violations', async () => {
    await expectNoA11yViolations(make())
  })
})
