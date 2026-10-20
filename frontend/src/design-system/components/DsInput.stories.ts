import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Lock } from 'lucide-vue-next'
import { ref } from 'vue'
import DsInput from './DsInput.vue'

const meta = {
  title: 'Design System/Input',
  component: DsInput,
  args: { label: 'Campaign name' },
  render: (args) => ({
    components: { DsInput },
    setup: () => ({ args, value: ref('') }),
    template: '<DsInput v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof DsInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('Campaign name')
    await userEvent.type(input, 'Spring Camry')
    await expect(input).toHaveValue('Spring Camry')
  },
}
export const WithHint: Story = { args: { hint: 'Shown to the dealer in reports' } }
export const Required: Story = { args: { required: true } }
export const WithError: Story = { args: { error: 'Enter a valid amount.' } }
export const Disabled: Story = { args: { disabled: true, hint: 'Locked: this field cannot be changed', hintIcon: Lock } }
