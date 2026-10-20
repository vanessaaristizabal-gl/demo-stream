import type { Meta, StoryObj } from '@storybook/vue3-vite'
import StatusBadge from './StatusBadge.vue'

const meta = { title: 'Shared/StatusBadge', component: StatusBadge, args: { status: 'applied' } } satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Applied: Story = {}
export const PendingApproval: Story = { args: { status: 'pending_approval' } }
export const Blocked: Story = { args: { status: 'blocked' } }
export const PartiallyFailed: Story = { args: { status: 'partially_failed' } }

export const AllStatuses: Story = {
  render: () => ({
    components: { StatusBadge },
    setup: () => ({
      statuses: [
        'applied',
        'approved',
        'applying',
        'pending_approval',
        'paused',
        'partially_failed',
        'blocked',
        'failed',
        'rejected',
        'no_changes',
      ],
    }),
    template: '<div class="ds-row"><StatusBadge v-for="s in statuses" :key="s" :status="s" /></div>',
  }),
}
