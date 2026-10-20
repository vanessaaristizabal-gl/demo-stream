import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import DsTabs from './DsTabs.vue'

const items = [
  { value: 'campaigns', label: 'Campaigns', count: 12 },
  { value: 'new', label: 'New campaign' },
  { value: 'guide', label: 'Platform guide' },
]

const meta = {
  title: 'Design System/Tabs',
  component: DsTabs,
  args: { label: 'Sandbox sections', items, modelValue: 'campaigns' },
  render: (args) => ({
    components: { DsTabs },
    setup: () => ({ args, value: ref('campaigns') }),
    template: `<DsTabs v-bind="args" v-model="value">
      <template #panel-campaigns><p>The table of campaigns.</p></template>
      <template #panel-new><p>The form to create one.</p></template>
      <template #panel-guide><p>What each platform collects.</p></template>
    </DsTabs>`,
  }),
} satisfies Meta<typeof DsTabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: 'New campaign' }))
    await expect(canvas.getByRole('tab', { name: 'New campaign' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByText('The form to create one.')).toBeVisible()
  },
}
