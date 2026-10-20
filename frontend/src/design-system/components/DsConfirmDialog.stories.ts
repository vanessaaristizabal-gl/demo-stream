import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import DsButton from './DsButton.vue'
import DsConfirmDialog from './DsConfirmDialog.vue'

const meta = {
  title: 'Design System/ConfirmDialog',
  component: DsConfirmDialog,
  args: {
    open: false,
    title: 'Stop all writes?',
    description: 'No change will be accepted or written to any ad account until an admin resumes writes.',
    confirmLabel: 'Engage emergency stop',
    tone: 'danger',
  },
  render: (args) => ({
    components: { DsConfirmDialog, DsButton },
    setup: () => ({ args, open: ref(false) }),
    template:
      '<div><DsButton variant="danger" @click="open = true">Emergency stop</DsButton><DsConfirmDialog v-bind="args" v-model:open="open" @confirm="open = false" /></div>',
  }),
} satisfies Meta<typeof DsConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Danger: Story = {}
export const Primary: Story = {
  args: { tone: 'primary', title: 'Approve this change?', confirmLabel: 'Approve', description: 'It will be written to the live account.' },
}
export const Busy: Story = { args: { loading: true } }
