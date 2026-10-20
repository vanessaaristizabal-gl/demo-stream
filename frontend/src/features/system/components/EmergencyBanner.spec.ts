import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EmergencyBanner from './EmergencyBanner.vue'

describe('EmergencyBanner', () => {
  it('announces the stop as an alert', () => {
    const w = mount(EmergencyBanner)

    expect(w.get('[role="alert"]').text()).toContain('Emergency stop is active')
  })

  it('lets admins resume writes', async () => {
    const w = mount(EmergencyBanner, { props: { canResume: true } })

    await w.get('button').trigger('click')

    expect(w.emitted('resume')).toHaveLength(1)
  })

  it('shows no controls to people who cannot resume', () => {
    expect(mount(EmergencyBanner).find('button').exists()).toBe(false)
  })

  it('can take focus, so focus has somewhere to go when the stop button disappears', () => {
    const w = mount(EmergencyBanner, { attachTo: document.body })

    ;(w.vm as unknown as { focus: () => void }).focus()

    expect(document.activeElement).toBe(w.element)
    w.unmount()
  })
})
