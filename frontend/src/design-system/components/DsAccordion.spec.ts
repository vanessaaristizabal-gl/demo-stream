import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DsAccordion from './DsAccordion.vue'

const items = [
  { value: 'a', title: 'First', summary: '3 rows' },
  { value: 'b', title: 'Second' },
]
const make = (defaultOpen: string[] = []) =>
  mount(DsAccordion, {
    props: { items, defaultOpen },
    slots: { 'item-a': '<p>Body A</p>', 'item-b': '<p>Body B</p>' },
    attachTo: document.body,
  })

describe('DsAccordion', () => {
  it('renders each section as a heading with a button that says whether it is expanded', () => {
    const w = make(['a'])
    const buttons = w.findAll('h3 button')
    expect(buttons.map((b) => [b.text(), b.attributes('aria-expanded')])).toEqual([
      ['First 3 rows', 'true'],
      ['Second', 'false'],
    ])
    w.unmount()
  })

  it('opens the sections asked for, mounts only open content, and shows the summary while closed', () => {
    const w = make(['a'])
    expect(w.text()).toContain('Body A')
    expect(w.text()).not.toContain('Body B')
    expect(w.text()).toContain('3 rows')
    w.unmount()
  })

  it('opens and closes a section on click, independently of the others', async () => {
    const w = make(['a'])
    await w.findAll('h3 button')[1].trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Body A')
    expect(w.text()).toContain('Body B')
    await w.findAll('h3 button')[0].trigger('click')
    await flushPromises()
    expect(w.text()).not.toContain('Body A')
    w.unmount()
  })
})
