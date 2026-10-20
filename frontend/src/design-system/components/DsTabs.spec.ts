import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DsTabs from './DsTabs.vue'

const items = [
  { value: 'one', label: 'One', count: 3 },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
]
const make = (modelValue = 'one') =>
  mount(DsTabs, {
    props: { label: 'Sections', items, modelValue, 'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v }) },
    slots: { 'panel-one': '<p>Panel one</p>', 'panel-two': '<p>Panel two</p>', 'panel-three': '<p>Panel three</p>' },
    attachTo: document.body,
  })
let w: ReturnType<typeof make>

describe('DsTabs', () => {
  it('is an accessible tablist with the current tab selected and its panel shown', () => {
    w = make('two')
    expect(w.get('[role="tablist"]').attributes('aria-label')).toBe('Sections')
    expect(w.findAll('[role="tab"]').map((t) => [t.text(), t.attributes('aria-selected')])).toEqual([
      ['One 3', 'false'],
      ['Two', 'true'],
      ['Three', 'false'],
    ])
    expect(w.get('[role="tabpanel"]:not([hidden])').text()).toBe('Panel two')
    w.unmount()
  })

  it('mounts only the active panel, so the others cost nothing until opened', () => {
    w = make()
    expect(w.findAll('[role="tabpanel"]:not([hidden])')).toHaveLength(1)
    expect(w.text()).not.toContain('Panel two')
    w.unmount()
  })

  it('switches panel on click and shows the count beside the label', async () => {
    w = make()
    expect(w.get('[role="tab"]').text()).toContain('3')
    await w.findAll('[role="tab"]')[2].trigger('mousedown', { button: 0 })
    await flushPromises()
    expect(w.get('[role="tabpanel"]:not([hidden])').text()).toBe('Panel three')
    w.unmount()
  })
})
