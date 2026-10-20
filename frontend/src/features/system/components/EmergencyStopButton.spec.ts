import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import EmergencyStopButton from './EmergencyStopButton.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  document.body.innerHTML = ''
})

const dialog = () => document.body.querySelector('[role="alertdialog"]')
// Reka keeps a closing dialog mounted for its exit animation; "open" means data-state=open.
const isOpen = () => dialog()?.getAttribute('data-state') === 'open'
const button = (name: string) =>
  [...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === name) as HTMLButtonElement

describe('EmergencyStopButton', () => {
  it('asks for confirmation instead of engaging immediately', async () => {
    wrapper = mount(EmergencyStopButton, { attachTo: document.body })

    await wrapper.get('button').trigger('click')
    await nextTick()

    expect(isOpen()).toBe(true)
    expect(wrapper.emitted('engage')).toBeUndefined()
  })

  it('engages only after the person confirms', async () => {
    wrapper = mount(EmergencyStopButton, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await nextTick()

    button('Engage emergency stop').click()
    await nextTick()

    expect(wrapper.emitted('engage')).toHaveLength(1)
  })

  it('cancel leaves everything as it was', async () => {
    wrapper = mount(EmergencyStopButton, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await nextTick()

    button('Cancel').click()
    await nextTick()

    expect(wrapper.emitted('engage')).toBeUndefined()
    expect(isOpen()).toBe(false)
  })

  it('closes the dialog once the request finishes', async () => {
    wrapper = mount(EmergencyStopButton, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await nextTick()

    await wrapper.setProps({ busy: true })
    expect(isOpen()).toBe(true)
    await wrapper.setProps({ busy: false })
    await nextTick()

    expect(isOpen()).toBe(false)
  })

  it('keeps the dialog open and shows the failure when the request fails', async () => {
    wrapper = mount(EmergencyStopButton, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await nextTick()

    await wrapper.setProps({ busy: true })
    await wrapper.setProps({ error: 'The server could not be reached.', busy: false })
    await nextTick()

    expect(isOpen()).toBe(true)
    expect(dialog()!.querySelector('[role="alert"]')?.textContent).toContain('could not be reached')
  })
})
