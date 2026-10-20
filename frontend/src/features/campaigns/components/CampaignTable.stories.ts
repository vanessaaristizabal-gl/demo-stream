import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { makeCampaign } from '@/shared/test/factories'
import CampaignTable from './CampaignTable.vue'

const meta = { title: 'Features/Campaigns/CampaignTable', component: CampaignTable, args: { onSelect: fn() } } satisfies Meta<
  typeof CampaignTable
>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    campaigns: [makeCampaign(), makeCampaign({ id: 2, name: 'Summer RAV4', status: 'paused', live: { daily_budget: 25000 } })],
  },
}
export const Empty: Story = { args: { campaigns: [] } }
