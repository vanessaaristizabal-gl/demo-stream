import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Check } from 'lucide-vue-next'
import DsButton from './DsButton.vue'

describe('DsButton', () => {
  it('renders its label, defaults to type=button and variant primary', () => {
    const w = mount(DsButton, { slots: { default: 'Save' } })

    expect(w.text()).toBe('Save')
    expect(w.attributes('type')).toBe('button')
    expect(w.classes()).toContain('ds-button--primary')
  })

  it('is disabled and aria-busy while loading, and ignores clicks', async () => {
    const w = mount(DsButton, { props: { loading: true }, slots: { default: 'Save' } })

    expect(w.attributes('disabled')).toBeDefined()
    expect(w.attributes('aria-busy')).toBe('true')
    await w.trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })

  it('renders the icon next to the label as decoration', () => {
    const w = mount(DsButton, { props: { icon: Check }, slots: { default: 'Approve' } })

    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.text()).toBe('Approve')
  })

  it('becomes a square icon-only button that keeps its aria-label', () => {
    const w = mount(DsButton, { props: { icon: Check }, attrs: { 'aria-label': 'Confirm' } })

    expect(w.classes()).toContain('ds-button--icon-only')
    expect(w.attributes('aria-label')).toBe('Confirm')
  })

  it('warns in development when an icon-only button has no accessible name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(DsButton, { props: { icon: Check } })

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('aria-label'))
    warn.mockRestore()
  })

  it.each(['secondary', 'danger', 'ghost'] as const)('applies the %s variant', (variant) => {
    expect(mount(DsButton, { props: { variant }, slots: { default: 'x' } }).classes()).toContain(`ds-button--${variant}`)
  })
})
