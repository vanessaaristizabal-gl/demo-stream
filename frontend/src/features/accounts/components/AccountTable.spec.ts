import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeAccount } from '@/shared/test/factories'
import AccountTable from './AccountTable.vue'

const accounts = [
  makeAccount(),
  makeAccount({ id: 2, provider: 'meta', dealer_name: 'Andy Mohr CDJR', monthly_budget: 420000, campaigns_count: 2 }),
  makeAccount({ id: 3, dealer_name: 'Lakeside Toyota', manufacturer: 'toyota', monthly_budget: null, campaigns_count: 1 }),
]
const make = (a = accounts) => mount(AccountTable, { props: { accounts: a }, attachTo: document.body })
const names = (w: ReturnType<typeof make>) => w.findAll('tbody a').map((x) => x.text())

describe('AccountTable', () => {
  it('lists each account with its provider, OEM, own monthly budget and campaign count', () => {
    const w = make()
    expect(names(w)).toEqual(['Andy Mohr CDJR', 'Lakeside Toyota', 'Schrute CDJR'])
    const schrute = w.findAll('tbody tr').find((r) => r.text().includes('Schrute'))!
    expect(schrute.text()).toContain('Google Ads')
    expect(schrute.text()).toContain('stellantis')
    expect(schrute.text()).toContain('$5,550.00')
    expect(schrute.text()).toContain('4')
  })

  it('says so, in text, when an account has no budget yet', () => {
    expect(
      make()
        .findAll('tbody tr')
        .find((r) => r.text().includes('Lakeside'))!
        .text(),
    ).toContain('No budget')
  })

  it('emits open with the account when its name is clicked', async () => {
    const w = make()
    await w
      .findAll('a')
      .find((a) => a.text() === 'Lakeside Toyota')!
      .trigger('click')
    expect(w.emitted('open')).toEqual([[accounts[2]]])
  })

  it('filters by provider, with counts, and by search text', async () => {
    const w = make()
    expect(w.findAll('[role="radio"]').map((r) => r.text())).toEqual(['All (3)', 'Google Ads (2)', 'Meta Ads (1)'])
    await w.findAll('[role="radio"]')[2].trigger('click')
    await flushPromises()
    expect(names(w)).toEqual(['Andy Mohr CDJR'])

    await w.findAll('[role="radio"]')[0].trigger('click')
    await w.get('input[type="search"]').setValue('toyota')
    expect(names(w)).toEqual(['Lakeside Toyota'])
    await w.get('input[type="search"]').setValue('zzz')
    expect(w.text()).toContain('No accounts match your search.')
  })

  it('sorts by monthly budget and exposes the state to assistive tech', async () => {
    const w = make()
    const header = w.findAll('th').find((th) => th.text().includes('Monthly budget'))!
    await header.get('button').trigger('click')
    expect(header.attributes('aria-sort')).toBe('ascending')
    expect(names(w)).toEqual(['Andy Mohr CDJR', 'Schrute CDJR', 'Lakeside Toyota']) // no budget sorts last
  })

  it('shows an empty state, and has no automatable accessibility violations', async () => {
    expect(make([]).text()).toContain('No accounts yet')
    await expectNoA11yViolations(make())
  })
})
