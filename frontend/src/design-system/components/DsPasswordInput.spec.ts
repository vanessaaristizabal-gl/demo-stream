import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DsPasswordInput from './DsPasswordInput.vue'

const make = () => mount(DsPasswordInput, { props: { label: 'Password', modelValue: 'secret', 'onUpdate:modelValue': () => {} } })

describe('DsPasswordInput', () => {
  it('hides the value by default and names the toggle for what it does', () => {
    const w = make()

    expect(w.get('input').attributes('type')).toBe('password')
    expect(w.get('button').attributes('aria-label')).toBe('Show password')
    expect(w.get('button').attributes('aria-pressed')).toBe('false')
  })

  it('reveals and re-hides the value, keeping aria-pressed in step', async () => {
    const w = make()

    await w.get('button').trigger('click')
    expect(w.get('input').attributes('type')).toBe('text')
    expect(w.get('button').attributes('aria-label')).toBe('Hide password')
    expect(w.get('button').attributes('aria-pressed')).toBe('true')

    await w.get('button').trigger('click')
    expect(w.get('input').attributes('type')).toBe('password')
  })

  it('does not put widget ARIA on the input (axe aria-allowed-attr)', () => {
    expect(make().get('input').attributes()).not.toHaveProperty('aria-expanded')
  })

  it('keeps the toggle out of form submission', () => {
    expect(make().get('button').attributes('type')).toBe('button')
  })
})
