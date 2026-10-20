import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { makeSandboxCampaign, makeTotals } from '@/shared/test/factories'
import SandboxCampaignTable from './SandboxCampaignTable.vue'

const campaigns = [
  makeSandboxCampaign({
    id: 1,
    name: 'Camry - Search',
    created_at: '2026-10-01T10:00:00+00:00',
    totals: makeTotals({ cost: 150000, clicks: 1234, conversions: 31.5 }),
  }),
  makeSandboxCampaign({
    id: 2,
    name: 'RAV4 - Awareness',
    platform: 'meta',
    created_at: '2026-10-10T10:00:00+00:00',
    totals: makeTotals({ cost: 90000, clicks: 80 }),
  }),
]
const names = (w: ReturnType<typeof mount>) => w.findAll('tbody a').map((a) => a.text())

describe('SandboxCampaignTable', () => {
  it('shows an empty state when nothing has been created', () => {
    expect(mount(SandboxCampaignTable, { props: { campaigns: [] } }).text()).toContain('No simulated campaigns yet')
  })

  it('lists the newest first with formatted spend, clicks and conversions', () => {
    const w = mount(SandboxCampaignTable, { props: { campaigns } })

    expect(names(w)).toEqual(['RAV4 - Awareness', 'Camry - Search'])
    expect(w.text()).toContain('$1,500.00')
    expect(w.text()).toContain('1,234')
    expect(w.text()).toContain('31.5')
    expect(w.text()).toContain('meta')
  })

  it('emits select with the campaign id', async () => {
    const w = mount(SandboxCampaignTable, { props: { campaigns } })

    await w
      .findAll('a')
      .find((a) => a.text() === 'Camry - Search')!
      .trigger('click')

    expect(w.emitted('select')).toEqual([[1]])
  })

  it('filters by platform text and explains when nothing matches', async () => {
    const w = mount(SandboxCampaignTable, { props: { campaigns } })
    const search = w.get('input[type="search"]')

    await search.setValue('meta')
    expect(names(w)).toEqual(['RAV4 - Awareness'])

    await search.setValue('zzz')
    expect(w.text()).toContain('No simulated campaigns match your search')
  })
})
