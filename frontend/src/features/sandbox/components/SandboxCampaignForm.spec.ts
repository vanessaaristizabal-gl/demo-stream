import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { makePlatformCatalog } from '@/shared/test/factories'
import SandboxCampaignForm from './SandboxCampaignForm.vue'

/** Find a control the way a user does: through its visible label. */
function field(w: VueWrapper, label: string) {
  const l = w.findAll('label').find((el) => el.text().startsWith(label))
  if (!l) throw new Error(`No label "${label}"`)
  return w.get(`#${CSS.escape(l.attributes('for')!)}`)
}
const submit = (w: VueWrapper) => w.get('button[type="submit"]')
const make = (props: Record<string, unknown> = {}) =>
  mount(SandboxCampaignForm, { props: { platforms: makePlatformCatalog(), ...props }, attachTo: document.body })
const goals = (w: VueWrapper) =>
  field(w, 'Goal')
    .findAll('option')
    .map((o) => o.text())

async function fillValid(w: VueWrapper) {
  await field(w, 'Campaign name').setValue('  Camry spring  ')
  await field(w, 'Vehicle model').setValue('Camry')
  await field(w, 'Target city').setValue('Austin')
  await field(w, 'Landing page').setValue('https://dealer.example.com/camry')
}

describe('SandboxCampaignForm', () => {
  it('offers both platforms and the goals of the selected one', () => {
    const w = make()

    expect(w.findAll('[role="radio"]').map((r) => r.text())).toEqual(['Google Ads', 'Meta Ads'])
    expect(goals(w)).toEqual(['Leads (MAXIMIZE_CONVERSIONS)', 'Traffic (MAXIMIZE_CLICKS)'])
    w.unmount()
  })

  it('switches the goals when the platform changes and falls back to a goal the platform has', async () => {
    const w = make()
    await field(w, 'Goal').setValue('traffic') // Google-only in this catalog

    await w.findAll('[role="radio"]')[1].trigger('click')

    expect(goals(w)).toEqual(['Leads (OUTCOME_LEADS)', 'Awareness (OUTCOME_AWARENESS)'])
    expect((field(w, 'Goal').element as HTMLSelectElement).value).toBe('leads')
    w.unmount()
  })

  it('keeps submit disabled until every field is valid', async () => {
    const w = make()
    expect(submit(w).attributes('disabled')).toBeDefined()

    await fillValid(w)

    expect(submit(w).attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  it('explains an invalid budget or address and blocks submit', async () => {
    const w = make()
    await fillValid(w)

    await field(w, 'Daily budget').setValue('0.5')
    await field(w, 'Landing page').setValue('javascript:alert(1)')

    expect(w.text()).toContain('Enter an amount between $1 and $10,000.')
    expect(w.text()).toContain('Enter a full http or https address.')
    expect(submit(w).attributes('disabled')).toBeDefined()
    await w.get('form').trigger('submit')
    expect(w.emitted('submit')).toBeUndefined()
    w.unmount()
  })

  it('submits trimmed values with the budget in cents', async () => {
    const w = make()
    await fillValid(w)
    await field(w, 'Daily budget').setValue('125.50')

    await w.get('form').trigger('submit')

    expect(w.emitted('submit')).toEqual([
      [
        {
          platform: 'google',
          name: 'Camry spring',
          goal: 'leads',
          daily_budget: 12550,
          vehicle: 'Camry',
          location: 'Austin',
          landing_url: 'https://dealer.example.com/camry',
        },
      ],
    ])
    w.unmount()
  })

  it('shows a server error and the pending state', () => {
    const w = make({ errorMessage: 'This Idempotency-Key was already used for a different campaign.', pending: true })

    expect(w.text()).toContain('already used for a different campaign')
    expect(submit(w).attributes('disabled')).toBeDefined()
    w.unmount()
  })
})
