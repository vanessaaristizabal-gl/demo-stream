import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Lock } from 'lucide-vue-next'
import DsInput from './DsInput.vue'

const make = (props: Record<string, unknown> = {}) =>
  mount(DsInput, { props: { label: 'Email', modelValue: '', 'onUpdate:modelValue': () => {}, ...props } })

describe('DsInput', () => {
  it('associates the visible label with the input', () => {
    const w = make()
    const input = w.get('input')

    expect(w.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(w.get('label').text()).toBe('Email')
  })

  it('updates v-model as the user types', async () => {
    const w = make()

    await w.get('input').setValue('a@b.co')

    expect(w.emitted('update:modelValue')).toEqual([['a@b.co']])
  })

  it('links hint and error to the input and announces the error', () => {
    const w = make({ hint: 'Work email', error: 'Required' })
    const describedBy = w.get('input').attributes('aria-describedby')!.split(' ')

    expect(describedBy).toHaveLength(2)
    expect(w.get('input').attributes('aria-invalid')).toBe('true')
    expect(w.get('[role="alert"]').text()).toBe('Required')
    expect(describedBy).toContain(w.get('[role="alert"]').attributes('id'))
  })

  it('has no aria-invalid or describedby when valid', () => {
    const w = make()

    expect(w.get('input').attributes('aria-invalid')).toBeUndefined()
    expect(w.get('input').attributes('aria-describedby')).toBeUndefined()
  })

  it('marks required fields for sighted users without duplicating it to screen readers', () => {
    const w = make({ required: true })

    expect(w.get('input').attributes('required')).toBeDefined()
    expect(w.get('.ds-field__required').attributes('aria-hidden')).toBe('true')
  })

  it('can be disabled and shows a hint icon as decoration', () => {
    const w = make({ disabled: true, hint: 'Locked', hintIcon: Lock })

    expect(w.get('input').attributes('disabled')).toBeDefined()
    expect(w.find('.ds-field__hint svg').attributes('aria-hidden')).toBe('true')
  })

  it('gives each instance in the same app its own id', () => {
    const w = mount({
      components: { DsInput },
      template: '<div><DsInput label="A" model-value="" /><DsInput label="B" model-value="" /></div>',
    })
    const [a, b] = w.findAll('input').map((i) => i.attributes('id'))

    expect(a).toBeTruthy()
    expect(a).not.toBe(b)
  })
})
