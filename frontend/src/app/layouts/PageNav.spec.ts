import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PageNav from './PageNav.vue'

const crumbs = [
  { label: 'Home', href: '/campaigns' },
  { label: 'Campaigns', href: '/campaigns' },
]

describe('PageNav', () => {
  it('shows the breadcrumb trail', () => {
    const w = mount(PageNav, { props: { crumbs, canGoBack: false } })

    expect(w.get('nav[aria-label="Breadcrumb"]').text()).toContain('Campaigns')
  })

  it('offers Back only when there is somewhere to go', () => {
    expect(mount(PageNav, { props: { crumbs, canGoBack: false } }).findAll('button')).toHaveLength(0)
    expect(
      mount(PageNav, { props: { crumbs, canGoBack: true } })
        .get('button')
        .text(),
    ).toBe('Back')
  })

  it('emits back and forwards breadcrumb navigation', async () => {
    const w = mount(PageNav, { props: { crumbs, canGoBack: true } })

    await w.get('button').trigger('click')
    await w.get('a').trigger('click')

    expect(w.emitted('back')).toHaveLength(1)
    expect(w.emitted('navigate')).toEqual([[crumbs[0]]])
  })

  it('renders nothing on pages with neither trail nor back target (login)', () => {
    expect(mount(PageNav, { props: { crumbs: [], canGoBack: false } }).html()).toBe('<!--v-if-->')
  })
})
