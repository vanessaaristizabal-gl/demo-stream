import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createWebHistory, createRouter, RouterView } from 'vue-router'
import { useBack } from './useBack'

const Probe = defineComponent({
  setup() {
    const { canGoBack, back } = useBack()
    return { canGoBack, back }
  },
  template: '<button :data-can="canGoBack" @click="back">back</button>',
})
const Empty = { template: '<div />' }

const cleanups: (() => void)[] = []
beforeEach(() => window.history.replaceState(null, '', '/'))
afterEach(() => {
  cleanups.splice(0).forEach((c) => c())
  window.history.replaceState(null, '', '/')
})

async function setup(initial: string) {
  const router = createRouter({
    history: createWebHistory(), // memory history keeps no state.back, so use the real thing (jsdom supports it)
    routes: [
      { path: '/login', name: 'login', component: Empty, meta: { public: true } },
      { path: '/campaigns', name: 'campaigns', component: Empty, meta: { crumb: 'Campaigns' } },
      { path: '/approvals', name: 'approvals', component: Empty, meta: { crumb: 'Approvals' } },
      { path: '/campaigns/:id', name: 'campaign', component: Empty, meta: { crumb: 'Campaign', parent: 'campaigns' } },
    ],
  })
  router.push(initial)
  await router.isReady()
  const w = mount({ components: { Probe, RouterView }, template: '<Probe /><RouterView />' }, { global: { plugins: [router] } })
  await flushPromises()
  cleanups.push(() => {
    w.unmount()
    router.options.history.destroy()
  })
  return { router, w, can: () => w.get('button').attributes('data-can') }
}

describe('useBack', () => {
  it('is never offered on a top-level page opened directly', async () => {
    const { can } = await setup('/campaigns')

    expect(can()).toBe('false')
  })

  it('is not offered on top-level pages even when there is history (the main navigation already goes there)', async () => {
    const { router, can } = await setup('/approvals')
    await router.push('/campaigns')
    await flushPromises()

    expect(router.options.history.state.back).toBe('/approvals') // there IS somewhere to go back to
    expect(can()).toBe('false')

    await router.push('/changelog')
    await flushPromises()
    expect(can()).toBe('false')
  })

  it('is offered on a nested page and returns to where the person came from', async () => {
    const { router, w, can } = await setup('/approvals')
    await router.push('/campaigns/5')
    await flushPromises()

    expect(can()).toBe('true')
    await w.get('button').trigger('click')

    // history.back() completes asynchronously (popstate); the previous page wins over the parent
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/approvals'))
  })

  it('falls back to the parent page when opened directly, so Back is never a dead end', async () => {
    const { router, w, can } = await setup('/campaigns/5')

    expect(can()).toBe('true')
    await w.get('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/campaigns')
  })

  it('is not offered on the login page', async () => {
    const { router, can } = await setup('/login')
    await router.push('/campaigns')
    await flushPromises()

    expect(can()).toBe('false')
  })
})
