import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import DsSegmented from './DsSegmented.vue'

const options = [
  { label: 'All', value: 'all' },
  { label: 'Platform', value: 'platform' },
  { label: 'Outside the platform', value: 'external' },
]

const meta = {
  title: 'Design System/Segmented',
  component: DsSegmented,
  args: { label: 'Source', options, modelValue: 'all' },
  render: (args) => ({
    components: { DsSegmented },
    setup: () => ({ args, value: ref('all') }),
    template: '<DsSegmented v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof DsSegmented>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'Platform' }))
    await expect(canvas.getByRole('radio', { name: 'Platform' })).toBeChecked()
  },
}
