import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { makeCampaign } from '@/shared/test/factories'
import AccountCampaigns from './AccountCampaigns.vue'

describe('AccountCampaigns', () => {
  it('lists the account campaigns with status, formatted budget and creation date', () => {
    const w = mount(AccountCampaigns, { props: { campaigns: [makeCampaign({ status: 'paused', live: { daily_budget: 25000 } })] } })
    const row = w.get('tbody tr')
    expect(row.text()).toContain('Spring Camry')
    expect(row.text()).toContain('paused')
    expect(row.text()).toContain('$250.00')
    expect(row.get('time').text()).toBe('Oct 1, 2026')
  })

  it('emits open with the campaign when its name is clicked', async () => {
    const c = makeCampaign()
    const w = mount(AccountCampaigns, { props: { campaigns: [c] } })
    await w.get('a').trigger('click')
    expect(w.emitted('open')).toEqual([[c]])
  })

  it('shows an empty state', () => {
    expect(mount(AccountCampaigns, { props: { campaigns: [] } }).text()).toContain('No campaigns on this account')
  })
})
