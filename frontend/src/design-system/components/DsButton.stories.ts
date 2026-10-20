import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Check, Send, Trash2 } from 'lucide-vue-next'
import DsButton from './DsButton.vue'

const meta = {
  title: 'Design System/Button',
  component: DsButton,
  args: { variant: 'primary', size: 'md', loading: false, disabled: false },
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'secondary', 'danger', 'ghost'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => ({
    components: { DsButton },
    setup: () => ({ args }),
    template: '<DsButton v-bind="args">Submit for approval</DsButton>',
  }),
} satisfies Meta<typeof DsButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Danger: Story = { args: { variant: 'danger' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Loading: Story = { args: { loading: true } }
export const Disabled: Story = { args: { disabled: true } }

export const WithIcon: Story = {
  render: (args) => ({
    components: { DsButton },
    setup: () => ({ args, Send }),
    template: '<DsButton v-bind="args" :icon="Send">Submit for approval</DsButton>',
  }),
}

export const IconOnly: Story = {
  render: (args) => ({
    components: { DsButton },
    setup: () => ({ args, Trash2 }),
    template: '<DsButton v-bind="args" variant="secondary" :icon="Trash2" aria-label="Delete rule" />',
  }),
}

export const Sizes: Story = {
  render: () => ({
    components: { DsButton },
    setup: () => ({ Check }),
    template:
      '<div class="ds-row"><DsButton size="sm" :icon="Check">Small</DsButton><DsButton :icon="Check">Medium</DsButton><DsButton size="lg" :icon="Check">Large</DsButton></div>',
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { DsButton },
    template:
      '<div class="ds-row"><DsButton>Primary</DsButton><DsButton variant="secondary">Secondary</DsButton><DsButton variant="danger">Danger</DsButton><DsButton variant="ghost">Ghost</DsButton></div>',
  }),
}
