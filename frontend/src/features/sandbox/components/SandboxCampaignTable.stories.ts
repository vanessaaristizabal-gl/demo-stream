import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { makeSandboxCampaign, makeTotals } from '@/shared/test/factories'
import SandboxCampaignTable from './SandboxCampaignTable.vue'

const meta = {
  title: 'Features/Sandbox/SandboxCampaignTable',
  component: SandboxCampaignTable,
  args: { onSelect: fn() },
} satisfies Meta<typeof SandboxCampaignTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    campaigns: [
      makeSandboxCampaign(),
      makeSandboxCampaign({
        id: 2,
        name: 'RAV4 - Local awareness',
        platform: 'meta',
        daily_budget: 9000,
        totals: makeTotals({ cost: 90000, clicks: 410 }),
      }),
    ],
  },
}
export const Empty: Story = { args: { campaigns: [] } }
