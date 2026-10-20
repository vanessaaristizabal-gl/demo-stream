import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import type { CampaignRow } from '../rows'
import CampaignTable from './CampaignTable.vue'

const live: CampaignRow = {
  key: 'live-1',
  kind: 'live',
  id: 1,
  name: 'Spring Camry',
  provider: 'google',
  owner: 'Acme Motors',
  status: 'active',
  daily_budget: 10000,
  created_at: '2026-10-01T14:30:00+00:00',
}
const simulated: CampaignRow = {
  key: 'simulated-2',
  kind: 'simulated',
  id: 2,
  name: 'Summer RAV4',
  provider: 'google',
  owner: 'Demo sandbox',
  status: 'paused',
  daily_budget: 25000,
  created_at: '2026-10-12T09:00:00+00:00',
}

const meta = {
  title: 'Features/Campaigns/CampaignTable',
  component: CampaignTable,
  args: { onOpen: fn(), onEdit: fn(), onRemove: fn() },
} satisfies Meta<typeof CampaignTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { rows: [live, simulated] } }
export const Empty: Story = { args: { rows: [] } }
