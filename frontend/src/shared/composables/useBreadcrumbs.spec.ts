import { beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { useBreadcrumbs, useCrumbLabel } from './useBreadcrumbs'

const campaignName = ref<string | undefined>(undefined)

const Trail = defineComponent({ setup: () => ({ crumbs: useBreadcrumbs() }), template: '<pre>{{ JSON.stringify(crumbs) }}</pre>' })
const Detail = defineComponent({
  setup() {
    useCrumbLabel(() => campaignName.value)
    return () => h('div')
  },
})
const Empty = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: Empty, meta: { public: true } },
      { path: '/campaigns', name: 'campaigns', component: Empty, meta: { crumb: 'Campaigns' } },
      { path: '/campaigns/:id', name: 'campaign', component: Detail, meta: { crumb: 'Campaign', parent: 'campaigns' } },
      { path: '/approvals', name: 'approvals', component: Empty, meta: { crumb: 'Approvals' } },
    ],
  })
}

async function mountAt(path: string) {
  const router = makeRouter()
  router.push(path)
  await router.isReady()
  const app = mount({ components: { Trail, RouterView }, template: '<Trail /><RouterView />' }, { global: { plugins: [router] } })
  await flushPromises()
  const crumbs = () => JSON.parse(app.get('pre').text()) as { label: string; href: string }[]
  return { router, crumbs }
}

beforeEach(() => {
  campaignName.value = undefined
})

describe('useBreadcrumbs', () => {
  it('starts with Home and ends with the current page', async () => {
    const { crumbs } = await mountAt('/approvals')

    expect(crumbs()).toEqual([
      { label: 'Home', href: '/campaigns' },
      { label: 'Approvals', href: '/approvals' },
    ])
  })

  it('walks declared parents', async () => {
    const { crumbs } = await mountAt('/campaigns/7')

    expect(crumbs().map((c) => c.label)).toEqual(['Home', 'Campaigns', 'Campaign'])
    expect(crumbs()[1].href).toBe('/campaigns')
    expect(crumbs()[2].href).toBe('/campaigns/7')
  })

  it('replaces the generic label once the page knows its own name', async () => {
    const { crumbs } = await mountAt('/campaigns/7')

    campaignName.value = 'Spring Camry'
    await nextTick()

    expect(crumbs().map((c) => c.label)).toEqual(['Home', 'Campaigns', 'Spring Camry'])
  })

  it('has no trail on pages that opt out (login)', async () => {
    const { crumbs } = await mountAt('/login')

    expect(crumbs()).toEqual([])
  })

  it('forgets a page label when the page goes away', async () => {
    const { router, crumbs } = await mountAt('/campaigns/7')
    campaignName.value = 'Spring Camry'
    await nextTick()

    await router.push('/approvals')
    await router.push('/campaigns/7')
    campaignName.value = undefined
    await nextTick()

    expect(crumbs().at(-1)?.label).toBe('Campaign')
  })

  it('keeps the page label when the same page component is reused for another campaign', async () => {
    const { router, crumbs } = await mountAt('/campaigns/7')
    campaignName.value = 'Spring Camry'
    await nextTick()

    await router.push('/campaigns/8') // same route record, so the component (and its setup) is reused
    await flushPromises()

    expect(crumbs().at(-1)?.label).toBe('Spring Camry')
    expect(crumbs().at(-1)?.href).toBe('/campaigns/8')
  })

  it('keeps the page label when only the query or hash changes', async () => {
    const { router, crumbs } = await mountAt('/campaigns/7')
    campaignName.value = 'Spring Camry'
    await nextTick()

    await router.push('/campaigns/7?tab=history#top')
    await flushPromises()

    expect(crumbs().at(-1)?.label).toBe('Spring Camry')
  })

  it('does not leak a label to a different page after leaving', async () => {
    const { router, crumbs } = await mountAt('/campaigns/7')
    campaignName.value = 'Spring Camry'
    await nextTick()

    await router.push('/approvals')
    await flushPromises()

    expect(crumbs().at(-1)?.label).toBe('Approvals')
  })
})
