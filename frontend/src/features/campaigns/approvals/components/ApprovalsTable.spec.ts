import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { expectNoA11yViolations } from '@/shared/test/axe'
import { makeChangeRequest } from '@/shared/test/factories'
import ApprovalsTable from './ApprovalsTable.vue'

const pending = makeChangeRequest()
const applied = makeChangeRequest({
  id: 8,
  status: 'applied',
  approver: { id: 3, name: 'Ana Approver' },
  campaign: { id: 2, name: 'Summer RAV4' },
  diff: { daily_budget: { old: 10000, new: 12000 } },
})
const blocked = makeChangeRequest({
  id: 9,
  status: 'blocked',
  campaign: { id: 3, name: 'Tacoma' },
  failure: { violations: [{ rule_id: 'TOY-001', message: 'Daily budget cannot exceed $500.' }] },
})
const make = (props: Record<string, unknown> = {}) =>
  mount(ApprovalsTable, { props: { requests: [pending, applied, blocked], canDecide: true, ...props }, attachTo: document.body })
const rows = (w: ReturnType<typeof make>) => w.findAll('tbody tr')
const showAll = async (w: ReturnType<typeof make>) => {
  await w
    .findAll('[role="radio"]')
    .find((r) => r.text().startsWith('All'))!
    .trigger('click')
  await flushPromises()
}

describe('ApprovalsTable', () => {
  it('lists pending requests first by default, with counts in the filter', () => {
    const w = make()
    expect(w.findAll('[role="radio"]').map((r) => r.text())).toEqual(['Pending (1)', 'All (3)'])
    expect(rows(w)).toHaveLength(1)
    expect(rows(w)[0].text()).toContain('Spring Camry')
  })

  it('shows what changes, from and to, with formatted values', async () => {
    const w = make()
    expect(rows(w)[0].text()).toContain('Status: active to paused')
    await showAll(w)
    expect(w.text()).toContain('Daily budget: $100.00 to $120.00')
  })

  it('shows the rule violations of a blocked request next to the change', async () => {
    const w = make()
    await showAll(w)
    expect(w.get('ul[aria-label="Rule violations in request 9"]').text()).toBe('TOY-001: Daily budget cannot exceed $500.')
  })

  it('an approver approves or rejects with an icon button named after the campaign', async () => {
    const w = make()
    await w.get('button[aria-label="Approve the change to Spring Camry"]').trigger('click')
    await w.get('button[aria-label="Reject the change to Spring Camry"]').trigger('click')
    expect(w.emitted('approve')).toEqual([[7]])
    expect(w.emitted('reject')).toEqual([[7]])
  })

  it('offers no decision buttons to someone who cannot decide, and says who it waits for', () => {
    const w = make({ canDecide: false })
    expect(w.findAll('button[aria-label^="Approve"], button[aria-label^="Reject"]')).toHaveLength(0)
    expect(rows(w)[0].text()).toContain('Waiting for an approver')
  })

  it('a decided request has no buttons and shows who decided', async () => {
    const w = make()
    await showAll(w)
    const row = rows(w).find((r) => r.text().includes('Summer RAV4'))!
    expect(row.findAll('button')).toHaveLength(0)
    expect(row.text()).toContain('by Ana Approver')
  })

  it('while one request is being decided its button is busy and the others wait', () => {
    const other = makeChangeRequest({ id: 10, campaign: { id: 4, name: 'Corolla' } })
    const w = make({ requests: [pending, other], busyId: 7 })
    expect(w.get('button[aria-label="Approve the change to Spring Camry"]').attributes('aria-busy')).toBe('true')
    expect(w.get('button[aria-label="Approve the change to Corolla"]').attributes('disabled')).toBeDefined()
    expect(w.get('button[aria-label="Reject the change to Corolla"]').attributes('disabled')).toBeDefined()
  })

  it('opens the campaign from its name', async () => {
    const w = make()
    await w.get('a').trigger('click')
    expect(w.emitted('open')).toEqual([[1]])
  })

  it('shows why a decision failed, and says so when nothing is pending', async () => {
    const w = make({ error: 'A change cannot be approved by the person who requested it.', requests: [applied] })
    expect(w.get('[role="alert"]').text()).toContain('cannot be approved by the person who requested it')
    expect(w.text()).toContain('Nothing is waiting for approval.')
  })

  it('shows an empty state when there are no requests at all', () => {
    expect(make({ requests: [] }).text()).toContain('No change requests')
  })

  it('has no automatable accessibility violations', async () => {
    await expectNoA11yViolations(make())
  })
})
