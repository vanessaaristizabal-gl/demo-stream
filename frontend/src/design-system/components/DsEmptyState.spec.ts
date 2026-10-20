import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Inbox } from 'lucide-vue-next'
import DsEmptyState from './DsEmptyState.vue'

describe('DsEmptyState', () => {
  it('shows the title and optional description', () => {
    const w = mount(DsEmptyState, { props: { title: 'Nothing here' }, slots: { default: 'Try again later' } })

    expect(w.text()).toContain('Nothing here')
    expect(w.text()).toContain('Try again later')
  })

  it('decorates with an icon that is hidden from assistive tech', () => {
    expect(
      mount(DsEmptyState, { props: { title: 'x', icon: Inbox } })
        .find('svg')
        .attributes('aria-hidden'),
    ).toBe('true')
  })
})
