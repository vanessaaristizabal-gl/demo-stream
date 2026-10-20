import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { LabDeploySettings } from '@/shared/api/types'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeDeployOptions, makeReceipt } from '@/shared/test/factories'
import DeployWizard from './DeployWizard.vue'

const settings: LabDeploySettings = { monthly_cap: 165000, pacing: 'even', status_at_write: 'paused' }
const base = {
  status: 'ready' as const,
  step: 'accounts' as const,
  options: makeDeployOptions(),
  receipts: [],
  oem: 'stellantis' as const,
  accountIds: [] as number[],
  settings,
}
const render = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) =>
  mount(DeployWizard, {
    props: {
      ...base,
      ...props,
      'onUpdate:accountIds': (v: number[]) => w?.setProps({ accountIds: v }),
      'onUpdate:settings': (v: LabDeploySettings) => w?.setProps({ settings: v }),
      'onUpdate:oem': (v: 'stellantis' | 'none') => w?.setProps({ oem: v }),
    },
    slots,
    attachTo: document.body,
  })
let w: ReturnType<typeof render> | undefined
const make = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) => (w = render(props, slots))
const button = (x: ReturnType<typeof render>, name: RegExp) => x.findAll('button').find((b) => name.test(b.text()))

describe('DeployWizard', () => {
  it('AC-1: shows three steps and marks the current one', () => {
    const x = make({ step: 'settings' })
    const items = x.findAll('ol[aria-label="Deploy steps"] li')
    expect(items.map((i) => i.text())).toEqual(['1. Accounts', '2. Settings', '3. Review and deploy'])
    expect(items.map((i) => i.attributes('aria-current'))).toEqual([undefined, 'step', undefined])
  })

  it('AC-2: Stellantis shows its rule count and source, No OEM says no rulebook applies', async () => {
    const x = make()
    expect(x.text()).toContain('35 rules encoded')
    expect(x.text()).toContain('Shift Digital Integration Spec v2.4')
    await x.setProps({ oem: 'none' })
    expect(x.text()).toContain('no OEM rulebook applied')
    expect(x.text()).not.toContain('35 rules encoded')
  })

  it('AC-3: each account shows its OEM and whether Salesforce has an active budget', () => {
    const rows = make().findAll('tbody tr')
    expect(rows[0].text()).toContain('Stellantis')
    expect(rows[0].text()).toContain('Active, up to $2,500.00')
    expect(rows[1].text()).toContain('None: will hold')
    expect(rows[2].text()).toContain('Toyota')
  })

  it('AC-4: accounts are selected one by one or all at once, counted, and Continue needs a selection', async () => {
    const x = make()
    const next = () => button(x, /Continue to settings/)!
    expect(next().attributes('disabled')).toBeDefined()
    expect(x.get('p[role="status"]').text()).toBe('0 of 3 accounts selected')

    await x.get('input[aria-label="Select Schrute CDJR"]').setValue(true)
    expect(x.get('p[role="status"]').text()).toBe('1 of 3 accounts selected')
    expect(next().attributes('disabled')).toBeUndefined()

    await x.get('label.all input').setValue(true)
    expect(x.get('p[role="status"]').text()).toBe('3 of 3 accounts selected')
    await x.get('label.all input').setValue(false)
    expect(x.get('p[role="status"]').text()).toBe('0 of 3 accounts selected')
  })

  it('AC-5: the cap is typed in dollars, stored as cents, and an invalid cap is refused', async () => {
    const x = make({ step: 'settings' })
    const cap = () => x.get('input[inputmode="decimal"]')
    await cap().setValue('1,250.50')
    expect(x.props('settings')).toMatchObject({ monthly_cap: 125050 })

    for (const bad of ['99.99', '12.345', '', 'abc']) {
      await cap().setValue(bad)
      expect(x.get('[role="alert"]').text(), bad).toContain('at least $100.00')
      expect(button(x, /Build the preview/)!.attributes('disabled'), bad).toBeDefined()
    }
    await cap().setValue('100')
    expect(x.find('[role="alert"]').exists()).toBe(false)
    expect(button(x, /Build the preview/)!.attributes('disabled')).toBeUndefined()
  })

  it('AC-6: pacing and status at write can be changed, and Paused is the recommended write status', async () => {
    const x = make({ step: 'settings' })
    const selects = x.findAll('select')
    expect(selects[1].findAll('option').map((o) => o.text())).toContain('Paused at write (recommended)')
    await selects[0].setValue('front_loaded')
    await selects[1].setValue('enabled')
    expect(x.props('settings')).toMatchObject({ pacing: 'front_loaded', status_at_write: 'enabled' })
  })

  it('AC-7: the previous step keeps the selection and settings', async () => {
    const x = make({ accountIds: [1, 3] })
    await button(x, /Continue to settings/)!.trigger('click')
    expect(x.emitted('next')).toHaveLength(1)
    await x.setProps({ step: 'settings' })
    await button(x, /Previous step/)!.trigger('click')
    expect(x.emitted('previous')).toHaveLength(1)
    await x.setProps({ step: 'accounts' })
    expect((x.get('input[aria-label="Select Schrute CDJR"]').element as HTMLInputElement).checked).toBe(true)
    expect((x.get('input[aria-label="Select Anderson CDJR"]').element as HTMLInputElement).checked).toBe(false)
    expect(x.props('settings')).toEqual(settings)
  })

  it('AC-8: the review step says nothing is written and shows the preview given to it', () => {
    const x = make({ step: 'review' }, { review: '<p class="preview-slot">Preview content</p>' })
    expect(x.text()).toContain('Preview only: nothing is written until you approve.')
    expect(x.get('.preview-slot').text()).toBe('Preview content')
  })

  it('AC-9: an options error shows its message and Try again emits reload', async () => {
    const x = make({ status: 'error', options: null, error: 'Options service is down' })
    expect(x.get('[role="alert"]').text()).toContain('Options service is down')
    await button(x, /Try again/)!.trigger('click')
    expect(x.emitted('reload')).toHaveLength(1)
  })

  it('AC-10: while the options load it shows a status message', () => {
    expect(make({ status: 'loading', options: null }).get('[role="status"]').text()).toContain('Loading the deploy options')
  })

  it('AC-11: receipts list the account, who, what, the path and the date', async () => {
    const x = make({ step: 'review', receipts: [makeReceipt(1), makeReceipt(2, { account: 'Best CDJR' })] })
    const rows = x
      .findAll('table[aria-label], table')
      .find((t) => t.get('caption').text() === 'Receipts for this deploy')!
      .findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Schrute CDJR')
    expect(rows[0].text()).toContain('Demo strategist')
    expect(rows[0].text()).toContain('Deployed Core Models Search (Stellantis rulebook)')
    expect(rows[0].text()).toContain('validated > compliance > dry-run > write')
    expect(rows[0].text()).toContain('Oct 20, 2026')
    await expectNoA11yViolations(x)
  })

  it('AC-12: when the step changes, focus moves to the new step heading', async () => {
    const x = make()
    await x.setProps({ step: 'settings' })
    await new Promise((r) => setTimeout(r))
    expect(document.activeElement).toBe(x.get('h2').element)
    expect(document.activeElement?.textContent).toBe('Settings')
  })

  it('AC-13: server text is rendered as plain text, never as HTML', () => {
    const options = makeDeployOptions()
    options.accounts[0].name = '<img src=x onerror=alert(1)>'
    const x = make({ options })
    expect(x.find('img').exists()).toBe(false)
    expect(x.text()).toContain('<img src=x onerror=alert(1)>')
    const r = make({ step: 'review', receipts: [makeReceipt(1, { summary: '<b>bold</b>' })] })
    expect(r.find('b').exists()).toBe(false)
  })

  it('AC-14: with no receipts the receipts section is not shown', () => {
    expect(make({ step: 'review' }).text()).not.toContain('Changelog receipts')
  })
})
