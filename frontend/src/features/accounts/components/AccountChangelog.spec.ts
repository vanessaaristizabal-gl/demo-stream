import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { ChangelogEntry } from '@/shared/api/types'
import AccountChangelog from './AccountChangelog.vue'

const entry = (overrides: Partial<ChangelogEntry> = {}): ChangelogEntry => ({
  id: 1,
  source: 'platform',
  field: 'daily_budget',
  old_value: 10000,
  new_value: 12000,
  occurred_at: '2026-10-15T16:07:03+00:00',
  campaign: { id: 1, name: 'Spring Camry' },
  actor: { id: 2, name: 'Sam Strategist' },
  ...overrides,
})

describe('AccountChangelog', () => {
  it('shows each change with campaign, from and to, who and whether it went through Stream or the provider', () => {
    const w = mount(AccountChangelog, {
      props: {
        entries: [entry(), entry({ id: 2, source: 'external', field: 'status', old_value: 'active', new_value: 'paused', actor: null })],
      },
    })
    const rows = w.findAll('tbody tr')
    expect(rows[0].text()).toContain('Spring Camry')
    expect(rows[0].text()).toContain('Daily budget: $100.00 to $120.00')
    expect(rows[0].text()).toContain('Through Stream')
    expect(rows[0].text()).toContain('Sam Strategist')
    expect(rows[1].text()).toContain('Status: active to paused')
    expect(rows[1].text()).toContain('In the provider')
  })

  it('shows an empty state', () => {
    expect(mount(AccountChangelog, { props: { entries: [] } }).text()).toContain('No changes recorded')
  })
})
