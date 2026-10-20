import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from './StatusBadge.vue'

describe('StatusBadge', () => {
  it.each([
    ['applied', 'success'],
    ['active', 'success'],
    ['pending_approval', 'warning'],
    ['partially_failed', 'warning'],
    ['blocked', 'danger'],
    ['rejected', 'danger'],
    ['approved', 'info'],
    ['something_new', 'neutral'],
  ])('maps %s to the %s tone', (status, tone) => {
    expect(mount(StatusBadge, { props: { status } }).classes()).toContain(`ds-tag--${tone}`)
  })

  it('humanises the label so state is carried by text, not color alone', () => {
    expect(mount(StatusBadge, { props: { status: 'partially_failed' } }).text()).toBe('partially failed')
  })
})
