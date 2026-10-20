import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DsTag from './DsTag.vue'

describe('DsTag', () => {
  it('shows its text and defaults to the neutral tone', () => {
    const w = mount(DsTag, { slots: { default: 'Draft' } })

    expect(w.text()).toBe('Draft')
    expect(w.classes()).toContain('ds-tag--neutral')
  })

  it.each(['info', 'success', 'warning', 'danger'] as const)('applies the %s tone', (tone) => {
    expect(mount(DsTag, { props: { tone }, slots: { default: 'x' } }).classes()).toContain(`ds-tag--${tone}`)
  })
})
