import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DsSelect from './DsSelect.vue'

const options = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
]
const make = (props: Record<string, unknown> = {}) =>
  mount(DsSelect, { props: { label: 'Status', options, modelValue: 'active', 'onUpdate:modelValue': () => {}, ...props } })

describe('DsSelect', () => {
  it('is a native select labelled by its visible label', () => {
    const w = make()

    expect(w.get('select').element.tagName).toBe('SELECT')
    expect(w.get('label').attributes('for')).toBe(w.get('select').attributes('id'))
    expect(w.findAll('option').map((o) => o.text())).toEqual(['Active', 'Paused'])
  })

  it('emits the chosen value', async () => {
    const w = make()

    await w.get('select').setValue('paused')

    expect(w.emitted('update:modelValue')).toEqual([['paused']])
  })

  it('reflects the model and can be disabled with a described hint', () => {
    const w = make({ modelValue: 'paused', disabled: true, hint: 'Locked' })

    expect((w.get('select').element as HTMLSelectElement).value).toBe('paused')
    expect(w.get('select').attributes('disabled')).toBeDefined()
    expect(w.get('select').attributes('aria-describedby')).toBe(w.get('.ds-field__hint').attributes('id'))
  })
})
