import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { makePlatformCatalog, makeSandboxDetail } from '@/shared/test/factories'
import StructureTree from './StructureTree.vue'

const [google, meta] = makePlatformCatalog()

/** Sections start folded except the campaign: open the rest the way a person would, with a click on each header. */
async function openAll(w: ReturnType<typeof mount>): Promise<void> {
  for (const button of w.findAll('h3 button[aria-expanded="false"]')) await button.trigger('click')
  await flushPromises()
}

describe('StructureTree', () => {
  it('shows the Google Ads hierarchy with keywords and the responsive search ad', async () => {
    const w = mount(StructureTree, { props: { campaign: makeSandboxDetail(), platform: google }, attachTo: document.body })
    await openAll(w)
    const text = w.text()

    expect(text).toContain('Campaign > Ad group > Ad')
    expect(text).toContain('Ad group: Camry - Buy')
    expect(text).toContain('Ad: RESPONSIVE_SEARCH_AD')
    expect(text).toContain('bidding_strategy_type')
    expect(text).toContain('MAXIMIZE_CONVERSIONS')
    expect(text).toContain('camry for sale')
    expect(w.findAll('h3 button').map((b) => b.attributes('aria-expanded'))).toEqual(['true', 'true', 'true'])
  })

  it('calls the second level an ad set on Meta', async () => {
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
    const w = mount(StructureTree, { props: { campaign: detail, platform: meta }, attachTo: document.body })
    await openAll(w)

    expect(w.text()).toContain('Ad set: Local audience')
    expect(w.text()).toContain('OUTCOME_LEADS')
    expect(w.text()).toContain('Ad: Image ad')
  })

  it('keeps the exact JSON one click away, folded by default', async () => {
    const w = mount(StructureTree, { props: { campaign: makeSandboxDetail(), platform: google }, attachTo: document.body })
    const raw = () => w.findAll('h3 button').find((b) => b.text() === 'Raw JSON payload')!
    expect(raw().attributes('aria-expanded')).toBe('false')
    expect(w.find('pre').exists()).toBe(false)

    await raw().trigger('click')
    await flushPromises()
    expect(JSON.parse(w.get('pre').text()).campaign.advertising_channel_type).toBe('SEARCH')
  })

  it('opens on the campaign and summarises each folded section', () => {
    const w = mount(StructureTree, { props: { campaign: makeSandboxDetail(), platform: google }, attachTo: document.body })
    expect(w.findAll('h3 button').map((b) => [b.text().split(' ')[0], b.attributes('aria-expanded')])).toEqual([
      ['Campaign', 'true'],
      ['Ad', 'false'],
      ['Raw', 'false'],
    ])
    expect(w.text()).toContain('bidding_strategy_type')
  })
})
