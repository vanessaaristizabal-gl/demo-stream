import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { LaunchSettings } from '@/shared/api/types'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeAccount, makeLaunchPlan } from '@/shared/test/factories'
import { defaultOem, defaultSettings } from './defaults'
import LaunchWizard from './LaunchWizard.vue'

const account = makeAccount()
const settings: LaunchSettings = defaultSettings(account)
const base = {
  status: 'ready' as const,
  step: 'playbook' as const,
  plan: makeLaunchPlan(),
  account,
  oem: 'stellantis' as const,
  campaignIds: [1, 2, 3],
  settings,
}
function make(props: Record<string, unknown> = {}, slots: Record<string, string> = {}): VueWrapper {
  const x = mount(LaunchWizard, {
    props: {
      ...base,
      ...props,
      'onUpdate:campaignIds': (v: number[]) => x.setProps({ campaignIds: v }),
      'onUpdate:settings': (v: LaunchSettings) => x.setProps({ settings: v }),
      'onUpdate:oem': (v: 'stellantis' | 'none') => x.setProps({ oem: v }),
    },
    slots,
    attachTo: document.body,
  })
  return x
}
const settingsOf = (x: VueWrapper) => (x.props() as { settings: LaunchSettings }).settings
const button = (x: VueWrapper, name: RegExp) => x.findAll('button').find((b) => name.test(b.text()))

describe('LaunchWizard', () => {
  it('AC-1: shows three steps and marks the current one', () => {
    const x = make({ step: 'settings' })
    const items = x.findAll('ol[aria-label="Launch steps"] li')
    expect(items.map((i) => i.text())).toEqual(['1. Playbook', '2. Settings', '3. Review and deploy'])
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

  it('AC-3: lists the campaigns the playbook launches with their share of the monthly cap', () => {
    const rows = make().findAll('tbody tr')
    expect(rows).toHaveLength(5)
    expect(rows[0].text()).toContain('New models · Search')
    expect(rows[0].text()).toContain('30%')
  })

  it('AC-4: campaigns are picked one by one or all at once, counted, and Continue needs at least one', async () => {
    const x = make({ campaignIds: [] })
    const next = () => button(x, /Continue to settings/)!
    expect(next().attributes('disabled')).toBeDefined()
    expect(x.get('p[role="status"]').text()).toBe('0 of 5 campaigns selected')

    await x.get('input[aria-label="Launch New models · Search"]').setValue(true)
    expect(x.get('p[role="status"]').text()).toBe('1 of 5 campaigns selected')
    expect(next().attributes('disabled')).toBeUndefined()

    await x.get('label.all input').setValue(true)
    expect(x.get('p[role="status"]').text()).toBe('5 of 5 campaigns selected')
    await x.get('label.all input').setValue(false)
    expect(x.get('p[role="status"]').text()).toBe('0 of 5 campaigns selected')
  })

  it("AC-5: settings start from the account's own values and nothing is editable until asked", () => {
    const x = make({ step: 'settings' })
    expect(x.get('dl').text()).toContain('$5,550.00')
    expect(x.get('dl').text()).toContain("this account's monthly budget")
    expect(x.get('dl').text()).toContain('Even')
    expect(x.get('dl').text()).toContain('Paused at write (recommended)')
    expect(x.find('input').exists()).toBe(false)
    expect(x.find('select').exists()).toBe(false)
  })

  it('AC-6: Change for this launch reveals the fields; the cap is typed in dollars and stored as integer cents', async () => {
    const x = make({ step: 'settings' })
    await button(x, /Change for this launch/)!.trigger('click')
    await x.get('input[inputmode="decimal"]').setValue('1,250.50')
    expect(settingsOf(x)).toMatchObject({ monthly_cap: 125050 })
    const selects = x.findAll('select')
    await selects[0].setValue('front_loaded')
    await selects[1].setValue('enabled')
    expect(settingsOf(x)).toMatchObject({ pacing: 'front_loaded', status_at_write: 'enabled' })
  })

  it('AC-7: an invalid cap is refused with an explanation and blocks the preview', async () => {
    const x = make({ step: 'settings' })
    await button(x, /Change for this launch/)!.trigger('click')
    for (const bad of ['99.99', '12.345', '', 'abc']) {
      await x.get('input[inputmode="decimal"]').setValue(bad)
      expect(x.get('[role="alert"]').text(), bad).toContain('at least $100.00')
      expect(button(x, /Build the preview/)!.attributes('disabled'), bad).toBeDefined()
    }
    await x.get('input[inputmode="decimal"]').setValue('100')
    expect(x.find('[role="alert"]').exists()).toBe(false)
  })

  it('AC-8: Use the account defaults puts every value back and hides the fields', async () => {
    const x = make({ step: 'settings', settings: { monthly_cap: 99900, pacing: 'front_loaded', status_at_write: 'enabled' } })
    await button(x, /Change for this launch/)!.trigger('click')
    await button(x, /Use the account defaults/)!.trigger('click')
    expect(settingsOf(x)).toEqual(defaultSettings(account))
    expect(x.find('input').exists()).toBe(false)
  })

  it('AC-9: an account without a Salesforce budget is warned in the settings step, and still can preview', () => {
    const x = make({
      step: 'settings',
      account: makeAccount({ monthly_budget: null }),
      settings: defaultSettings(makeAccount({ monthly_budget: null })),
    })
    expect(x.get('[role="status"]').text()).toContain('has no budget in Salesforce yet')
    expect(button(x, /Build the preview/)!.attributes('disabled')).toBeUndefined()
  })

  it('AC-10: the previous step keeps the picks and settings', async () => {
    const x = make({ campaignIds: [1, 4] })
    await button(x, /Continue to settings/)!.trigger('click')
    expect(x.emitted('next')).toHaveLength(1)
    await x.setProps({ step: 'settings' })
    await button(x, /Previous step/)!.trigger('click')
    expect(x.emitted('previous')).toHaveLength(1)
    await x.setProps({ step: 'playbook' })
    expect((x.get('input[aria-label="Launch New models · Search"]').element as HTMLInputElement).checked).toBe(true)
    expect((x.get('input[aria-label="Launch Used · Search"]').element as HTMLInputElement).checked).toBe(false)
    expect(settingsOf(x)).toEqual(settings)
  })

  it('AC-11: the review step says nothing is written and shows the preview given to it', () => {
    const x = make({ step: 'review' }, { review: '<p class="preview-slot">Preview content</p>' })
    expect(x.text()).toContain('Preview only: nothing is written until you approve.')
    expect(x.get('.preview-slot').text()).toBe('Preview content')
  })

  it('AC-12: an error shows its message and Try again emits reload; while loading it says so', async () => {
    const x = make({ status: 'error', plan: null, error: 'Playbook service is down' })
    expect(x.get('[role="alert"]').text()).toContain('Playbook service is down')
    await button(x, /Try again/)!.trigger('click')
    expect(x.emitted('reload')).toHaveLength(1)
    expect(make({ status: 'loading', plan: null }).get('[role="status"]').text()).toContain('Loading the playbook')
  })

  it('AC-13: when the step changes, focus moves to the new step heading', async () => {
    const x = make()
    await x.setProps({ step: 'settings' })
    await new Promise((r) => setTimeout(r))
    expect(document.activeElement).toBe(x.get('h2').element)
    expect(document.activeElement?.textContent).toBe('Settings')
  })

  it('AC-14: server text is rendered as plain text, never as HTML', () => {
    const plan = makeLaunchPlan()
    plan.campaigns[0].name = '<img src=x onerror=alert(1)>'
    const x = make({ plan })
    expect(x.find('img').exists()).toBe(false)
    expect(x.text()).toContain('<img src=x onerror=alert(1)>')
  })

  it('AC-15: the OEM rulebook starts from the account: Stellantis accounts get it, others none', () => {
    expect(defaultOem(makeAccount({ manufacturer: 'stellantis' }))).toBe('stellantis')
    expect(defaultOem(makeAccount({ manufacturer: 'toyota' }))).toBe('none')
    expect(defaultOem(makeAccount({ manufacturer: null }))).toBe('none')
  })

  it('has no automatable accessibility violations in any step', async () => {
    await expectNoA11yViolations(make())
    await expectNoA11yViolations(make({ step: 'settings' }))
  })
})
