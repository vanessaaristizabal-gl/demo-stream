import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useTabQuery } from './useTabQuery'

const TABS = ['campaigns', 'new', 'guide'] as const
describe('useTabQuery', () => {
  it('reads the tab from the URL, falls back for a missing or unknown value, and writes without piling up history', async () => {
    const { mount } = await import('@vue/test-utils')
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/s', component: { template: '<i />' } }] })
    await router.push('/s?tab=guide')
    await router.isReady()
    let tab!: ReturnType<typeof useTabQuery>
    mount({ setup: () => ((tab = useTabQuery(TABS, 'campaigns')), () => null) }, { global: { plugins: [router] } })

    expect(tab.value).toBe('guide')
    await router.push('/s?tab=hacked')
    expect(tab.value).toBe('campaigns')

    tab.value = 'new'
    await new Promise((r) => setTimeout(r))
    expect(router.currentRoute.value.query.tab).toBe('new')
    tab.value = 'campaigns' // the default keeps the URL clean
    await new Promise((r) => setTimeout(r))
    expect(router.currentRoute.value.query.tab).toBeUndefined()
  })
})
