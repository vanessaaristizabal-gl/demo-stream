import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { expectNoA11yViolations } from '@/shared/test/axe'
import EmergencyStopPanel from './EmergencyStopPanel.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  document.body.innerHTML = ''
})
const make = (props: Record<string, unknown> = {}) =>
  (wrapper = mount(EmergencyStopPanel, { props: { active: false, ...props }, attachTo: document.body }))
const button = (name: string) =>
  [...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === name) as HTMLButtonElement | undefined

describe('EmergencyStopPanel', () => {
  it('explains what the switch does and says in text whether writes are enabled', () => {
    const w = make()
    expect(w.text()).toContain('no change to any ad account')
    expect(w.text()).toContain('campaigns keep running as they are')
    expect(w.get('[role="status"]').text()).toBe('Writes are enabled')
  })

  it('offers the emergency stop, which asks for confirmation before it emits engage', async () => {
    const w = make()
    await w.get('button').trigger('click')
    await nextTick()
    expect(w.emitted('engage')).toBeUndefined()
    button('Engage emergency stop')!.click()
    await nextTick()
    expect(w.emitted('engage')).toHaveLength(1)
  })

  it('while writes are stopped it says so and offers Resume writes instead', async () => {
    const w = make({ active: true })
    expect(w.get('[role="status"]').text()).toBe('Writes are stopped')
    expect(button('Emergency stop')).toBeUndefined()
    await button('Resume writes')!.click()
    expect(w.emitted('resume')).toHaveLength(1)
  })

  it('moves focus to the status when the state flips, so the focused button is not lost', async () => {
    const w = make()
    await w.setProps({ active: true })
    await nextTick()
    expect(document.activeElement).toBe(w.get('[role="status"]').element)
  })

  it('shows why a resume failed', () => {
    expect(make({ active: true, error: 'The server could not be reached.' }).get('[role="alert"]').text()).toBe(
      'The server could not be reached.',
    )
  })

  it('has no automatable accessibility violations', async () => {
    await expectNoA11yViolations(make())
  })
})
