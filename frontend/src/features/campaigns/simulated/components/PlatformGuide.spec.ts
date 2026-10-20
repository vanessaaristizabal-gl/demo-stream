import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { makePlatformCatalog } from '@/shared/test/factories'
import PlatformGuide from './PlatformGuide.vue'

describe('PlatformGuide', () => {
  it('explains the vocabulary of both platforms, one folded section each, the first open', async () => {
    const w = mount(PlatformGuide, { props: { platforms: makePlatformCatalog() }, attachTo: document.body })
    expect(w.findAll('h3 button').map((b) => [b.text().replace(/ \d+ metrics$/, ''), b.attributes('aria-expanded')])).toEqual([
      ['Google Ads', 'true'],
      ['Meta Ads', 'false'],
    ])
    await w.findAll('h3 button')[1].trigger('click')
    await flushPromises()
    const text = w.text()

    expect(text).toContain('Campaign')
    expect(text).toContain('Ad group')
    expect(text).toContain('Ad set')
    expect(text).toContain('metrics.cost_micros')
    expect(text).toContain('bidding_strategy_type')
    expect(text).toContain('Awareness = OUTCOME_AWARENESS')
    expect(text).toContain('Unique people who saw the ad.')
  })

  it('renders nothing but the intro while the catalog loads', () => {
    const w = mount(PlatformGuide, { props: { platforms: [] } })

    expect(w.findAll('h3')).toHaveLength(0)
  })
})
