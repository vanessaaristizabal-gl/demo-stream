import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { expectNoA11yViolations } from '@/shared/test/axe'
import AccountSummary from './AccountSummary.vue'

const base = {
  status: 'ready' as const,
  name: 'Schrute CDJR',
  pace: 'on-pace' as const,
  oem: 'Stellantis',
  tier: 'King',
  strategist: 'Jim Halpert',
  accountCode: 'ADV-SCHCDJR',
  googleAdsCustomerId: '742-118-9930',
  allocatedBudget: 555000,
  spendToday: 19300,
  monthToDateSpend: 348000,
  availableSpend: 207000,
  auditing: false,
}
const render = (props: Record<string, unknown> = {}) => mount(AccountSummary, { props: { ...base, ...props }, attachTo: document.body })
const button = (w: ReturnType<typeof render>, name: RegExp) => w.findAll('button').find((b) => name.test(b.text()))

describe('AccountSummary', () => {
  it('AC-1: the account name is a heading and the pace status is a tag with text', () => {
    expect(render().get('h1').text()).toBe('Schrute CDJR')
    expect(render().text()).toContain('On pace')
    expect(render({ pace: 'underpacing' }).text()).toContain('Underpacing')
    expect(render({ pace: 'overspending' }).text()).toContain('Overspending')
  })

  it('AC-2: it shows the OEM, tier, strategist, account code and Google Ads customer id', () => {
    const facts = render().findAll('dl')[0].text()
    expect(facts).toMatch(/OEM\s*Stellantis/)
    expect(facts).toMatch(/Tier\s*King/)
    expect(facts).toMatch(/Strategist\s*Jim Halpert/)
    expect(facts).toMatch(/Account code\s*ADV-SCHCDJR/)
    expect(facts).toMatch(/Google Ads customer id\s*742-118-9930/)
  })

  it('AC-3: allocated budget per month, spend today and available spend are money from cents', () => {
    const money = render().findAll('dl')[1].text()
    expect(money).toMatch(/Allocated budget\s*\$5,550\.00\s*\/ month/)
    expect(money).toMatch(/Spend today\s*\$193\.00/)
    expect(money).toMatch(/Available spend\s*\$2,070\.00/)
  })

  it('AC-4: available spend is shown as received, not recalculated', () => {
    // Deliberately not allocated minus month-to-date: the component must not derive it.
    expect(render({ availableSpend: 123400 }).findAll('dl')[1].text()).toMatch(/Available spend\s*\$1,234\.00/)
  })

  it('AC-5: a progress bar shows month-to-date spend against the allocation, with a value and a name', async () => {
    const w = render()
    const bar = w.get('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('63')
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('100')
    expect(bar.attributes('aria-label')).toBe('Month-to-date spend of Schrute CDJR')
    expect(bar.attributes('aria-valuetext')).toBe('$3,480.00 of $5,550.00 spent')
    expect(bar.get('.fill').attributes('style')).toContain('width: 63%')
    expect(bar.get('.fill').classes()).toContain('fill--success')
    expect(render({ pace: 'underpacing' }).get('.fill').classes()).toContain('fill--warning')
    // Nearly, but not yet, the whole budget never reads as full.
    expect(render({ monthToDateSpend: 554000 }).get('[role="progressbar"]').attributes('aria-valuenow')).toBe('99')
    await expectNoA11yViolations(w)
  })

  it('AC-6: while loading it shows a status message, and on error a Try again control that emits reload', async () => {
    const loading = render({ status: 'loading' })
    expect(loading.get('[role="status"]').text()).toContain('Loading')
    expect(loading.find('h1').exists()).toBe(false)

    const failed = render({ status: 'error', error: 'The account service is down.' })
    expect(failed.get('[role="alert"]').text()).toContain('The account service is down.')
    await button(failed, /Try again/)!.trigger('click')
    expect(failed.emitted('reload')).toHaveLength(1)
  })

  it('AC-7: Run audit emits audit and is disabled and busy while an audit runs', async () => {
    const idle = render()
    await button(idle, /Run audit/)!.trigger('click')
    expect(idle.emitted('audit')).toHaveLength(1)

    const busy = button(render({ auditing: true }), /Run audit/)!
    expect(busy.attributes('disabled')).toBeDefined()
    expect(busy.attributes('aria-busy')).toBe('true')
  })

  it('AC-8: text from the server is rendered as text, never as HTML', () => {
    const w = render({ name: '<img src=x onerror=alert(1)>', strategist: '<b>Jim</b>', accountCode: '<script>x</script>' })
    expect(w.get('h1').text()).toBe('<img src=x onerror=alert(1)>')
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('b').exists()).toBe(false)
    expect(w.text()).toContain('<b>Jim</b>')
  })

  it('AC-9: zero allocated budget says so instead of showing a bar, and never divides by zero', () => {
    const w = render({ allocatedBudget: 0, availableSpend: 0 })
    expect(w.text()).toContain('No budget allocated')
    expect(w.find('[role="progressbar"]').exists()).toBe(false)
    expect(w.text()).not.toMatch(/NaN|Infinity/)
  })

  it('AC-10: spend above the allocation fills the bar and says how much it is over', () => {
    const w = render({ pace: 'overspending', monthToDateSpend: 567000, availableSpend: -12000 })
    expect(w.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('100')
    expect(w.get('.fill').attributes('style')).toContain('width: 100%')
    expect(w.text()).toContain('$120.00 over')
    // Exactly on budget fills the bar but is not "over".
    const exact = render({ monthToDateSpend: 555000 })
    expect(exact.get('.fill').attributes('style')).toContain('width: 100%')
    expect(exact.text()).not.toMatch(/\$[\d,.]+ over/)
  })

  it('AC-6: focus moves to the loading message after Try again, and to the error when a retry fails', async () => {
    const w = render({ status: 'error', error: 'Down.' })
    await w.setProps({ status: 'loading' })
    await nextTick()
    expect(document.activeElement).toBe(w.get('[role="status"]').element)
    await w.setProps({ status: 'error' })
    await nextTick()
    expect(w.get('[role="alert"]').element.parentElement).toBe(document.activeElement)
  })

  it('AC-7: when the audit ends, focus returns to Run audit', async () => {
    const w = render({ auditing: true })
    await w.setProps({ auditing: false })
    await nextTick()
    expect(document.activeElement).toBe(button(w, /Run audit/)!.element)
  })
})
