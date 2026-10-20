import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { makeCampaign } from '@/shared/test/factories'
import CampaignTable from './CampaignTable.vue'

const campaigns = [
  makeCampaign({ id: 5, name: 'Spring Camry', created_at: '2026-10-01T14:30:00+00:00' }),
  makeCampaign({ id: 6, name: 'Another', status: 'paused', live: { daily_budget: 25000 }, created_at: '2026-12-24T09:00:00+00:00' }),
  makeCampaign({ id: 7, name: 'Zebra Lease', live: { daily_budget: 5000 }, created_at: '2026-03-02T09:00:00+00:00' }),
]
const names = (w: ReturnType<typeof mount>) => w.findAll('tbody a').map((a) => a.text())

describe('CampaignTable', () => {
  it('shows an empty state when there are no campaigns', () => {
    expect(mount(CampaignTable, { props: { campaigns: [] } }).text()).toContain('No campaigns yet')
  })

  it('lists campaigns sorted by name, with formatted budget and status', () => {
    const w = mount(CampaignTable, { props: { campaigns } })

    expect(names(w)).toEqual(['Another', 'Spring Camry', 'Zebra Lease'])
    expect(w.text()).toContain('$250.00')
    expect(w.text()).toContain('paused')
  })

  it('emits select with the campaign id when a name is clicked', async () => {
    const w = mount(CampaignTable, { props: { campaigns } })

    await w
      .findAll('a')
      .find((a) => a.text() === 'Spring Camry')!
      .trigger('click')

    expect(w.emitted('select')).toEqual([[5]])
  })

  it('filters rows with the search box and explains when nothing matches', async () => {
    const w = mount(CampaignTable, { props: { campaigns } })
    const search = w.get('input[type="search"]')

    await search.setValue('camry')
    expect(names(w)).toEqual(['Spring Camry'])

    await search.setValue('nothing like this')
    expect(w.text()).toContain('No campaigns match your search')
  })

  it('sorts by budget when its header is activated, and exposes the state to assistive tech', async () => {
    const w = mount(CampaignTable, { props: { campaigns } })
    const header = () => w.findAll('th').find((th) => th.text().includes('Daily budget'))!

    await header().get('button').trigger('click')

    expect(header().attributes('aria-sort')).toBe('ascending')
    expect(names(w)).toEqual(['Zebra Lease', 'Spring Camry', 'Another'])
  })

  it('shows each campaign creation date as a semantic <time> in the shared format', () => {
    const w = mount(CampaignTable, { props: { campaigns } })
    const cell = w
      .findAll('tbody tr')
      .find((r) => r.text().includes('Spring Camry'))!
      .get('time')

    expect(cell.attributes('datetime')).toBe('2026-10-01T14:30:00+00:00')
    expect(cell.text()).toMatch(/^[A-Z][a-z]{2} \d{1,2}, 2026$/) // "Oct 1, 2026"
  })

  it('sorts by creation date chronologically, not alphabetically', async () => {
    const w = mount(CampaignTable, { props: { campaigns } })
    const header = () => w.findAll('th').find((th) => th.text().includes('Created'))!

    await header().get('button').trigger('click')
    expect(names(w)).toEqual(['Zebra Lease', 'Spring Camry', 'Another']) // Mar, Oct, Dec

    await header().get('button').trigger('click')
    expect(names(w)).toEqual(['Another', 'Spring Camry', 'Zebra Lease'])
  })

  it('paginates large lists', () => {
    const many = Array.from({ length: 25 }, (_, i) => makeCampaign({ id: i + 1, name: `Campaign ${String(i + 1).padStart(2, '0')}` }))
    const w = mount(CampaignTable, { props: { campaigns: many } })

    expect(names(w)).toHaveLength(10)
    expect(w.get('[aria-live="polite"]').text()).toBe('Page 1 of 3')
  })
})
