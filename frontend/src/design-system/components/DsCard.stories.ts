import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DsCard from './DsCard.vue'

const meta = {
  title: 'Design System/Card',
  component: DsCard,
  render: (args) => ({
    components: { DsCard },
    setup: () => ({ args }),
    template: '<DsCard v-bind="args"><h2>Spring Camry</h2><p class="ds-muted">Acme Motors · google</p></DsCard>',
  }),
} satisfies Meta<typeof DsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Unpadded: Story = { args: { padded: false } }
