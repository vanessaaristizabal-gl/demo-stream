import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DsMessage from './DsMessage.vue'

describe('DsMessage', () => {
  it('interrupts assistive tech only for errors (role=alert), others are polite (role=status)', () => {
    expect(mount(DsMessage, { props: { tone: 'danger' }, slots: { default: 'Bad' } }).attributes('role')).toBe('alert')
    for (const tone of ['info', 'success', 'warning'] as const) {
      expect(mount(DsMessage, { props: { tone }, slots: { default: 'ok' } }).attributes('role')).toBe('status')
    }
  })

  it('lets the caller override the role', () => {
    expect(mount(DsMessage, { props: { tone: 'danger', role: 'status' }, slots: { default: 'x' } }).attributes('role')).toBe('status')
  })

  it('renders content with a decorative icon', () => {
    const w = mount(DsMessage, { props: { tone: 'warning' }, slots: { default: 'Careful' } })

    expect(w.text()).toBe('Careful')
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
  })
})
