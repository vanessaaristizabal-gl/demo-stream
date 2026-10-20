import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { makeChangeRequest } from '@/shared/test/factories'
import ChangeRequestCard from './ChangeRequestCard.vue'

const meta = {
  title: 'Features/Approvals/ChangeRequestCard',
  component: ChangeRequestCard,
  args: { request: makeChangeRequest(), canDecide: true, onApprove: fn(), onReject: fn() },
} satisfies Meta<typeof ChangeRequestCard>

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Approve' }))
    await expect(args.onApprove).toHaveBeenCalledWith(7)
  },
}

export const ReadOnly: Story = { args: { canDecide: false } }

export const BlockedByRule: Story = {
  args: {
    request: makeChangeRequest({
      status: 'blocked',
      diff: { daily_budget: { old: 10000, new: 90000 } },
      failure: { violations: [{ rule_id: 'TOY-001', message: 'Daily budget cannot exceed $500.' }] },
    }),
  },
}

export const Applied: Story = {
  args: { request: makeChangeRequest({ status: 'applied', approver: { id: 3, name: 'Ana Approver' } }) },
}
