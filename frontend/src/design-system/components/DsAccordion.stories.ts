import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import DsAccordion from './DsAccordion.vue'

const items = [
  { value: 'campaign', title: 'Campaign', summary: '6 fields' },
  { value: 'groups', title: 'Ad groups', summary: '2' },
  { value: 'raw', title: 'Raw JSON payload' },
]

const meta = {
  title: 'Design System/Accordion',
  component: DsAccordion,
  args: { items, defaultOpen: ['campaign'] },
  render: (args) => ({
    components: { DsAccordion },
    setup: () => ({ args }),
    template: `<DsAccordion v-bind="args">
      <template #item-campaign><p>Name, status, budget.</p></template>
      <template #item-groups><p>Two ad groups with keywords.</p></template>
      <template #item-raw><pre>{ "kind": "demo" }</pre></template>
    </DsAccordion>`,
  }),
} satisfies Meta<typeof DsAccordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Raw JSON payload/ }))
    await expect(canvas.getByRole('button', { name: /Raw JSON payload/ })).toHaveAttribute('aria-expanded', 'true')
  },
}
export const AllClosed: Story = { args: { defaultOpen: [] } }
