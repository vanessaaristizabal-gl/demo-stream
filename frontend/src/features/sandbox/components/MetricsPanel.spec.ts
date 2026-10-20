import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { makeDailyMetrics, makePlatformCatalog, makeSandboxDetail, makeTotals } from '@/shared/test/factories'
import MetricsPanel from './MetricsPanel.vue'

const [google, meta] = makePlatformCatalog()

describe('MetricsPanel', () => {
  it('shows each metric the platform reports with its native API field', () => {
    const w = mount(MetricsPanel, { props: { campaign: makeSandboxDetail(), platform: google } })

    expect(w.text()).toContain('Impressions')
    expect(w.text()).toContain('12,000')
    expect(w.text()).toContain('metrics.impressions')
    expect(w.text()).toContain('$1,500.00')
    expect(w.text()).toContain('metrics.cost_micros')
    expect(w.text()).toContain('The API reports money in micros')
  })

  it('shows Meta-only metrics such as reach', () => {
    const detail = makeSandboxDetail({ platform: 'meta', totals: makeTotals({ reach: 9000, frequency: 1.33 }) })
    const w = mount(MetricsPanel, { props: { campaign: detail, platform: meta } })

    expect(w.text()).toContain('Reach')
    expect(w.text()).toContain('9,000')
    expect(w.text()).toContain('spend')
  })

  it('describes the chart in words and lists every day in a table, newest first', () => {
    const w = mount(MetricsPanel, { props: { campaign: makeSandboxDetail({ daily_metrics: makeDailyMetrics(3) }), platform: google } })

    expect(w.get('svg[role="img"]').attributes('aria-label')).toBe('Daily spend over 3 days, from $50.00 to $52.00.')
    expect(w.findAll('svg rect')).toHaveLength(3)
    const dates = w.findAll('tbody tr').map((r) => r.get('time').text())
    expect(dates).toEqual(['Oct 12, 2026', 'Oct 11, 2026', 'Oct 10, 2026'])
  })

  it('paginates a 30-day table', () => {
    const w = mount(MetricsPanel, { props: { campaign: makeSandboxDetail({ daily_metrics: makeDailyMetrics(30) }), platform: google } })

    expect(w.findAll('tbody tr')).toHaveLength(10)
  })
})
