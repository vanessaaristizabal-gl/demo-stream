import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DsSegmented from './DsSegmented.vue'

const options = [
  { label: 'All', value: 'all' },
  { label: 'Platform', value: 'platform' },
]
const make = (modelValue = 'all') =>
  mount(DsSegmented, { props: { label: 'Source', options, modelValue, 'onUpdate:modelValue': () => {} }, attachTo: document.body })

describe('DsSegmented', () => {
  it('is an accessible radio group with the current value checked', () => {
    const w = make('platform')

    expect(w.get('[role="radiogroup"]').attributes('aria-label')).toBe('Source')
    const radios = w.findAll('[role="radio"]')
    expect(radios.map((r) => [r.text(), r.attributes('aria-checked')])).toEqual([
      ['All', 'false'],
      ['Platform', 'true'],
    ])
    w.unmount()
  })

  it('emits the selected value on click', async () => {
    const w = make()

    await w.findAll('[role="radio"]')[1].trigger('click')

    expect(w.emitted('update:modelValue')?.[0]).toEqual(['platform'])
    w.unmount()
  })

  it('is a single tab stop: the group takes focus and items are reached with arrow keys', async () => {
    const w = make()
    await flushPromises() // Reka settles its roving focus after mount

    expect(w.get('[role="radiogroup"]').attributes('tabindex')).toBe('0')
    expect(w.findAll('[role="radio"]').every((r) => r.attributes('tabindex') === '-1')).toBe(true)
    w.unmount()
  })

  it('marks the selected option with a check mark as well as color (not color alone)', () => {
    const w = make('platform')
    const radios = w.findAll('[role="radio"]')

    expect(radios[0].find('svg').exists()).toBe(false)
    expect(radios[1].find('svg').exists()).toBe(true)
    expect(radios[1].find('svg').attributes('aria-hidden')).toBe('true')
    w.unmount()
  })
})
