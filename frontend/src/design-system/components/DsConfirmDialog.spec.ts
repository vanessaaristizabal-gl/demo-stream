import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DsConfirmDialog from './DsConfirmDialog.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  document.body.innerHTML = ''
})

const open = (props: Record<string, unknown> = {}) => {
  wrapper = mount(DsConfirmDialog, {
    props: {
      open: true,
      'onUpdate:open': (v: boolean) => wrapper?.setProps({ open: v }),
      title: 'Stop all writes?',
      description: 'No change will be written.',
      confirmLabel: 'Engage',
      ...props,
    },
    attachTo: document.body,
  })
  return wrapper
}
const dialog = () => document.body.querySelector('[role="alertdialog"]')
const button = (name: string) =>
  [...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === name) as HTMLButtonElement

describe('DsConfirmDialog', () => {
  it('renders an alertdialog named by its title and described by its description', async () => {
    open()
    await nextTick()

    const d = dialog()!
    expect(d).not.toBeNull()
    expect(document.getElementById(d.getAttribute('aria-labelledby')!)?.textContent).toBe('Stop all writes?')
    expect(document.getElementById(d.getAttribute('aria-describedby')!)?.textContent).toBe('No change will be written.')
  })

  it('renders nothing while closed', async () => {
    open({ open: false })
    await nextTick()

    expect(dialog()).toBeNull()
  })

  it('emits confirm without closing by itself (the caller decides after the async work)', async () => {
    const w = open()
    await nextTick()

    button('Engage').click()
    await nextTick()

    expect(w.emitted('confirm')).toHaveLength(1)
    expect(dialog()).not.toBeNull()
  })

  it('cancel closes the dialog without confirming', async () => {
    const w = open()
    await nextTick()

    button('Cancel').click()
    await nextTick()

    expect(w.emitted('confirm')).toBeUndefined()
    expect(w.emitted('update:open')?.[0]).toEqual([false])
  })

  it('shows a busy confirm button and locks cancel while loading', async () => {
    open({ loading: true })
    await nextTick()

    expect(button('Engage').getAttribute('aria-busy')).toBe('true')
    expect(button('Cancel').disabled).toBe(true)
  })

  it('shows a failure inside the dialog as an alert, so a failed action is never silent', async () => {
    open({ error: 'Could not reach the server.' })
    await nextTick()

    const alert = dialog()!.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Could not reach the server.')
  })

  it('shows no alert when there is no error', async () => {
    open()
    await nextTick()

    expect(dialog()!.querySelector('[role="alert"]')).toBeNull()
  })
})
