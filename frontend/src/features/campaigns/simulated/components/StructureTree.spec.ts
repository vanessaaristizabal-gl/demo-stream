import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { makePlatformCatalog, makeSandboxDetail } from '@/shared/test/factories'
import StructureTree from './StructureTree.vue'

const [google, meta] = makePlatformCatalog()

describe('StructureTree', () => {
  it('shows the Google Ads hierarchy with keywords and the responsive search ad', () => {
    const w = mount(StructureTree, { props: { campaign: makeSandboxDetail(), platform: google } })
    const text = w.text()

    expect(text).toContain('Campaign > Ad group > Ad')
    expect(text).toContain('Ad group: Camry - Buy')
    expect(text).toContain('Ad: RESPONSIVE_SEARCH_AD')
    expect(text).toContain('bidding_strategy_type')
    expect(text).toContain('MAXIMIZE_CONVERSIONS')
    expect(text).toContain('camry for sale')
    expect(w.find('ul[aria-label="Ad groups"]').exists()).toBe(true)
  })

  it('calls the second level an ad set on Meta', () => {
    const detail = makeSandboxDetail({
      platform: 'meta',
      structure: {
        campaign: { id: '1', objective: 'OUTCOME_LEADS' },
        groups: [
          {
            kind: 'ad_set',
            id: '2',
            name: 'Local audience',
            status: 'ACTIVE',
            optimization_goal: 'LEAD_GENERATION',
            ads: [{ id: '3', name: 'Image ad', status: 'ACTIVE' }],
          },
        ],
      },
    })
    const w = mount(StructureTree, { props: { campaign: detail, platform: meta } })

    expect(w.text()).toContain('Ad set: Local audience')
    expect(w.text()).toContain('OUTCOME_LEADS')
    expect(w.text()).toContain('Ad: Image ad')
  })

  it('exposes the raw payload for people who want the exact JSON', () => {
    const w = mount(StructureTree, { props: { campaign: makeSandboxDetail(), platform: google } })

    expect(w.get('details summary').text()).toBe('Raw JSON payload')
    expect(JSON.parse(w.get('details pre').text()).campaign.advertising_channel_type).toBe('SEARCH')
  })
})
