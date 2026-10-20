import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { LabApplyFailure } from '@/shared/api/types'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeLabPreview } from '@/shared/test/factories'
import BulkApprovalPreview from './BulkApprovalPreview.vue'

const failures: LabApplyFailure[] = [
  { id: 1, code: 'rate_limited', message: 'Provider rate limit reached. Retry in 30 seconds.', retryable: true },
  { id: 2, code: 'provider_rejected', message: 'Provider rejected the update: learning phase.', retryable: true },
]

const base = { status: 'ready' as const, preview: makeLabPreview(), appliedCount: 0, failures: [], pending: false }
const render = (props: Record<string, unknown> = {}) =>
  mount(BulkApprovalPreview, { props: { ...base, ...props }, attachTo: document.body })
const button = (w: ReturnType<typeof render>, name: RegExp) => w.findAll('button').find((b) => name.test(b.text()))
/** The lists live in tabs: open one the way a person does. */
const openTab = async (w: ReturnType<typeof render>, name: RegExp) => {
  await w
    .findAll('[role="tab"]')
    .find((t) => name.test(t.text()))!
    .trigger('mousedown', { button: 0 })
  await flushPromises()
}
/** A table is found by its caption, the way a screen-reader user finds it. */
const table = (w: ReturnType<typeof render>, caption: string) => w.findAll('table').find((t) => t.get('caption').text() === caption)

describe('BulkApprovalPreview', () => {
  it('AC-1: the summary shows total, ready and held counts', () => {
    const w = render()
    const stats = w.get('dl').text()
    expect(stats).toMatch(/Total\s*33/)
    expect(stats).toMatch(/Ready to apply\s*30/)
    expect(stats).toMatch(/Held\s*3/)
  })

  it('AC-2: ready items show account, budget before and budget after as money', () => {
    const row = table(render(), 'Budget changes ready to apply')!.findAll('tbody tr')[0]
    expect(row.text()).toContain('Dealer 001')
    expect(row.text()).toContain('$50.00')
    expect(row.text()).toContain('$55.00')
  })

  it('AC-3: held items are listed with their reason and are not counted as ready', async () => {
    const w = render()
    expect(w.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Changes to apply 30', 'Held 3'])
    expect(table(w, 'Budget changes ready to apply')!.text()).not.toContain('Held dealer')
    await openTab(w, /^Held/)
    const held = table(w, 'Held items and the reason for each')!
    expect(held.findAll('tbody tr')).toHaveLength(3)
    expect(held.text()).toContain('Locked by manufacturer rule')
    expect(button(w, /Approve/)!.text()).toBe('Approve 30 changes')
  })

  it('AC-4: Approve emits approve once', async () => {
    const w = render()
    await button(w, /Approve/)!.trigger('click')
    expect(w.emitted('approve')).toHaveLength(1)
  })

  it('AC-5: while applying, Approve is disabled and busy', () => {
    const w = render({ pending: true })
    const approve = button(w, /Approve/)!
    expect(approve.attributes('disabled')).toBeDefined()
    expect(approve.attributes('aria-busy')).toBe('true')
  })

  it('AC-6: after a partial failure it says how many applied and failed and lists each failure with its reason', () => {
    const w = render({ appliedCount: 28, failures })
    expect(w.get('section[aria-labelledby]').text()).toContain('28 applied, 2 failed')
    const rows = table(w, 'Failed items')!.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[1].text()).toContain('Dealer 002')
    expect(rows[1].text()).toContain('Provider rejected the update: learning phase.')
  })

  it('AC-7: a rate-limit failure is labelled and counted apart from other failures', () => {
    const w = render({ appliedCount: 28, failures })
    expect(w.text()).toContain('1 stopped at the provider rate limit')
    expect(w.text()).toContain('rate limited')
    expect(w.text()).toContain('provider rejected')
  })

  it('AC-8: Retry failed shows only while retryable failures remain and emits retry', async () => {
    const w = render({ appliedCount: 28, failures })
    await button(w, /Retry failed/)!.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)

    const done = render({ appliedCount: 30, failures: [] })
    expect(button(done, /Retry failed/)).toBeUndefined()
    const fixed = render({ appliedCount: 28, failures: failures.map((f) => ({ ...f, retryable: false })) })
    expect(button(fixed, /Retry failed/)).toBeUndefined()
  })

  it('AC-9: when everything was applied it shows success and no retry', () => {
    const w = render({ appliedCount: 30, failures: [] })
    expect(w.get('[role="status"]').text()).toContain('All 30 changes were applied')
    expect(button(w, /Retry/)).toBeUndefined()
  })

  it('AC-10: a load error shows its message and Try again emits reload', async () => {
    const w = render({ status: 'error', preview: null, error: 'Server exploded' })
    expect(w.get('[role="alert"]').text()).toContain('Server exploded')
    await button(w, /Try again/)!.trigger('click')
    expect(w.emitted('reload')).toHaveLength(1)
  })

  it('AC-11: an empty batch shows the empty state and no Approve', () => {
    const w = render({ preview: makeLabPreview({ ready: 0, held: 0 }) })
    expect(w.text()).toContain('Nothing to approve')
    expect(button(w, /Approve/)).toBeUndefined()
  })

  it('AC-12: controls are real buttons, and the result receives focus when applying finishes', async () => {
    const w = render({ pending: true })
    await w.setProps({ appliedCount: 28, failures, pending: false })
    await new Promise((r) => setTimeout(r))
    expect(document.activeElement).toBe(w.get('section[aria-labelledby]').element)
    expect(w.findAll('button').every((b) => b.element.tagName === 'BUTTON')).toBe(true)
    await expectNoA11yViolations(w)
  })

  it('AC-13: a failed apply request shows its message and Approve stays available', () => {
    const w = render({ actionError: 'Too many requests. Retry in 8 seconds.' })
    expect(w.text()).toContain('Too many requests. Retry in 8 seconds.')
    expect(button(w, /Approve/)!.attributes('disabled')).toBeUndefined()
  })

  it('AC-14: when every item is held, the held list shows and Approve is disabled', () => {
    const w = render({ preview: makeLabPreview({ ready: 0, held: 4 }) })
    expect(w.get('[role="tab"][aria-selected="true"]').text()).toBe('Held 4')
    expect(table(w, 'Held items and the reason for each')!.findAll('tbody tr')).toHaveLength(4)
    expect(button(w, /Approve/)!.attributes('disabled')).toBeDefined()
  })

  it('AC-16: after a result Approve is gone and only Retry failed remains', () => {
    const w = render({ appliedCount: 28, failures })
    expect(button(w, /^Approve/)).toBeUndefined()
    expect(button(w, /Retry failed/)).toBeDefined()
    expect(button(render({ appliedCount: 30, failures: [] }), /^Approve/)).toBeUndefined()
  })

  it('AC-17: items neither applied nor failed are counted in the result and block the success message', () => {
    const w = render({ appliedCount: 28, failures: [] })
    expect(w.text()).toContain('2 items were neither applied nor reported as failed.')
    expect(w.text()).not.toContain('were applied.')
  })

  it('AC-18: when the apply request fails, focus moves to the error message', async () => {
    const w = render({ pending: true })
    await w.setProps({ pending: false, actionError: 'Too many requests. Retry in 8 seconds.' })
    await new Promise((r) => setTimeout(r))
    expect(document.activeElement?.textContent).toContain('Too many requests')
  })

  it('AC-19: the lists are two tabs with counts, opening on the changes or, when nothing is ready, on the held items', () => {
    const w = render()
    expect(w.findAll('[role="tab"]').map((t) => [t.text(), t.attributes('aria-selected')])).toEqual([
      ['Changes to apply 30', 'true'],
      ['Held 3', 'false'],
    ])
    expect(w.findAll('[role="tabpanel"]:not([hidden])')).toHaveLength(1)
    expect(
      render({ preview: makeLabPreview({ ready: 0, held: 2 }) })
        .get('[role="tab"][aria-selected="true"]')
        .text(),
    ).toBe('Held 2')
  })

  it('AC-15: server text is rendered as plain text, never as HTML', async () => {
    const preview = makeLabPreview({ ready: 1, held: 1 })
    preview.items[0].account = '<img src=x onerror=alert(1)>'
    preview.items[1].hold_reason = '<b>bold</b>'
    const w = render({ preview })
    await openTab(w, /^Held/)
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('b').exists()).toBe(false)
    expect(w.text()).toContain('<b>bold</b>')
    await openTab(w, /^Changes/)
    expect(w.text()).toContain('<img src=x onerror=alert(1)>')
    expect(w.find('img').exists()).toBe(false)
  })
})
