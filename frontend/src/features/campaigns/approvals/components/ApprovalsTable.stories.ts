import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { makeChangeRequest } from '@/shared/test/factories'
import ApprovalsTable from './ApprovalsTable.vue'

const meta = {
  title: 'Features/Campaigns/ApprovalsTable',
  component: ApprovalsTable,
  args: {
    canDecide: true,
    busyId: null,
    requests: [
      makeChangeRequest(),
      makeChangeRequest({ id: 8, campaign: { id: 2, name: 'Summer RAV4' }, diff: { daily_budget: { old: 10000, new: 12000 } } }),
    ],
    onApprove: fn(),
    onReject: fn(),
    onOpen: fn(),
  },
} satisfies Meta<typeof ApprovalsTable>

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {}
export const ReadOnly: Story = { args: { canDecide: false } }
export const Deciding: Story = { args: { busyId: 7 } }
export const Blocked: Story = {
  args: {
    requests: [
      makeChangeRequest({
        id: 9,
        status: 'blocked',
        failure: { violations: [{ rule_id: 'TOY-001', message: 'Daily budget cannot exceed $500.' }] },
      }),
    ],
  },
}
export const Empty: Story = { args: { requests: [] } }
