import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import DsPasswordInput from './DsPasswordInput.vue'

const meta = {
  title: 'Design System/PasswordInput',
  component: DsPasswordInput,
  args: { label: 'Password' },
  render: (args) => ({
    components: { DsPasswordInput },
    setup: () => ({ args, value: ref('hunter2') }),
    template: '<DsPasswordInput v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof DsPasswordInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show password' }))
    await expect(canvas.getByLabelText('Password')).toHaveAttribute('type', 'text')
    await expect(canvas.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true')
  },
}
export const WithError: Story = { args: { error: 'Invalid credentials.' } }
