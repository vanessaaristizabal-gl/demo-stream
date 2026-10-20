import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DsMessage from './DsMessage.vue'

const meta = {
  title: 'Design System/Message',
  component: DsMessage,
  args: { tone: 'info' },
  argTypes: { tone: { control: 'radio', options: ['info', 'success', 'warning', 'danger'] } },
  render: (args) => ({
    components: { DsMessage },
    setup: () => ({ args }),
    template: '<DsMessage v-bind="args">Change #8 submitted and waiting for approval.</DsMessage>',
  }),
} satisfies Meta<typeof DsMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {}
export const Success: Story = { args: { tone: 'success' } }
export const Warning: Story = { args: { tone: 'warning' } }
export const Danger: Story = { args: { tone: 'danger' } }
