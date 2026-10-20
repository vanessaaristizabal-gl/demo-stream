import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Inbox } from 'lucide-vue-next'
import DsEmptyState from './DsEmptyState.vue'

const meta = {
  title: 'Design System/EmptyState',
  component: DsEmptyState,
  args: { title: 'No campaigns yet', icon: Inbox },
  render: (args) => ({
    components: { DsEmptyState },
    setup: () => ({ args }),
    template: '<DsEmptyState v-bind="args">Adopted campaigns will appear here.</DsEmptyState>',
  }),
} satisfies Meta<typeof DsEmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithoutIcon: Story = { args: { icon: undefined } }
