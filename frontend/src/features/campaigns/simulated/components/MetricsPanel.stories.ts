import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { makeDailyMetrics, makePlatformCatalog, makeSandboxDetail, makeTotals } from '@/shared/test/factories'
import MetricsPanel from './MetricsPanel.vue'

const [google, meta] = makePlatformCatalog()

const storyMeta = { title: 'Features/Sandbox/MetricsPanel', component: MetricsPanel } satisfies Meta<typeof MetricsPanel>

export default storyMeta
type Story = StoryObj<typeof storyMeta>

export const GoogleAds: Story = { args: { campaign: makeSandboxDetail({ daily_metrics: makeDailyMetrics(30) }), platform: google } }
export const MetaAds: Story = {
  args: {
    platform: meta,
    campaign: makeSandboxDetail({
      platform: 'meta',
      daily_metrics: makeDailyMetrics(30),
      totals: makeTotals({ reach: 9000, frequency: 1.33, cpm: 1250 }),
    }),
  },
}
