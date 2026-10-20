import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { makeCampaign } from '@/shared/test/factories'
import ChangeForm from './ChangeForm.vue'

/** Find a control the way a user does: through its visible label. */
function field(w: VueWrapper, label: string) {
  const l = w.findAll('label').find((el) => el.text().startsWith(label))
  if (!l) throw new Error(`No label "${label}"`)
  return w.get(`#${CSS.escape(l.attributes('for')!)}`)
}
const submit = (w: VueWrapper) => w.get('button[type="submit"]')
const make = (campaign = makeCampaign(), props: Record<string, unknown> = {}) => mount(ChangeForm, { props: { campaign, ...props } })

describe('ChangeForm', () => {
  it('prefills from live state and disables submit until something changes', () => {
    const w = make()

    expect((field(w, 'Name').element as HTMLInputElement).value).toBe('Spring Camry')
    expect((field(w, 'Daily budget').element as HTMLInputElement).value).toBe('100')
    expect(submit(w).attributes('disabled')).toBeDefined()
  })

  it('submits only the fields that changed, with budget converted to cents', async () => {
    const w = make()

    await field(w, 'Daily budget').setValue('125.50')
    await w.get('form').trigger('submit')

    expect(w.emitted('submit')).toEqual([[{ daily_budget: 12550 }]])
  })

  it('submits a status change through the native select', async () => {
    const w = make()

    await field(w, 'Status').setValue('paused')
    await w.get('form').trigger('submit')

    expect(w.emitted('submit')).toEqual([[{ status: 'paused' }]])
  })

  it('disables only the locked fields and says why, with the reason linked to the field', () => {
    const w = make(makeCampaign({ locks: ['name', 'daily_budget'] }))

    expect(field(w, 'Name').attributes('disabled')).toBeDefined()
    expect(field(w, 'Daily budget').attributes('disabled')).toBeDefined()
    expect(field(w, 'Status').attributes('disabled')).toBeUndefined()
    expect(w.findAll('.ds-field__hint').filter((h) => h.text().includes('Locked'))).toHaveLength(2)
    expect(field(w, 'Name').attributes('aria-describedby')).toBeTruthy()
  })

  it('disables the status select when status is locked', () => {
    const w = make(makeCampaign({ locks: ['status'] }))

    expect(field(w, 'Status').attributes('disabled')).toBeDefined()
    expect(field(w, 'Name').attributes('disabled')).toBeUndefined()
  })

  it('blocks an invalid budget and announces the error', async () => {
    const w = make()

    await field(w, 'Daily budget').setValue('abc')

    expect(w.get('[role="alert"]').text()).toContain('Enter a valid amount')
    expect(field(w, 'Daily budget').attributes('aria-invalid')).toBe('true')
    expect(submit(w).attributes('disabled')).toBeDefined()
    await w.get('form').trigger('submit')
    expect(w.emitted('submit')).toBeUndefined()
  })

  it('shows a server error as an alert', () => {
    const w = make(makeCampaign(), { errorMessage: 'Field [name] is locked' })

    expect(w.get('[role="alert"]').text()).toContain('locked')
  })

  it('resets the form when the campaign changes underneath it', async () => {
    const w = make()
    await w.setProps({ campaign: makeCampaign({ live: { name: 'Renamed', status: 'paused', daily_budget: 5000 } }) })

    expect((field(w, 'Name').element as HTMLInputElement).value).toBe('Renamed')
    expect((field(w, 'Daily budget').element as HTMLInputElement).value).toBe('50')
  })
})
