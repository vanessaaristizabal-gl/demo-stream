import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { Rulebook } from '@/shared/api/types'
import RulebooksTable from './RulebooksTable.vue'

const rulebook = (overrides: Partial<Rulebook> = {}): Rulebook => ({
  id: 1,
  manufacturer: 'toyota',
  version: 2,
  effective_from: '2026-01-01T00:00:00.000000Z',
  effective_to: null,
  rules: [
    { id: 'TOY-001', field: 'daily_budget', operator: 'max', value: 50000, message: 'Daily budget cannot exceed $500.' },
    { id: 'TOY-002', field: 'name', operator: 'required', message: 'Campaign name is required.' },
  ],
  ...overrides,
})
const make = (rulebooks: Rulebook[]) => mount(RulebooksTable, { props: { rulebooks }, attachTo: document.body })

describe('RulebooksTable', () => {
  it('lists each version with its rule count and effective dates in the shared format, folded', () => {
    const w = make([
      rulebook(),
      rulebook({ id: 2, version: 1, effective_to: '2026-01-01T00:00:00.000000Z', effective_from: '2025-01-01T00:00:00.000000Z' }),
    ])
    const headers = w.findAll('h3 button')
    expect(headers.map((h) => h.text())).toEqual([
      'Toyota rulebook v2 2 rules, effective Jan 1, 2026',
      'Toyota rulebook v1 2 rules, effective Jan 1, 2025 to Jan 1, 2026',
    ])
    expect(headers.every((h) => h.attributes('aria-expanded') === 'false')).toBe(true)
  })

  it('opens a version to show its rules, and marks the one in force', async () => {
    const w = make([rulebook()])
    await w.get('h3 button').trigger('click')
    await flushPromises()
    expect(w.get('ul[aria-label="Rules of Toyota rulebook v2"]').text()).toContain('TOY-001: Daily budget cannot exceed $500.')
    expect(w.text()).toContain('Current version')
  })

  it('shows an empty state', () => {
    expect(make([]).text()).toContain('No rulebooks yet')
  })
})
