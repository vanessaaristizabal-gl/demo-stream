import type { Meta, StoryObj } from '@storybook/vue3-vite'
import RulebooksTable from './RulebooksTable.vue'

const rules = [
  { id: 'STL-014', field: 'headline', operator: 'forbid', value: 'superlatives', message: 'No superlatives in headlines.' },
  { id: 'STL-022', field: 'description', operator: 'required', message: 'An offer must show its end date.' },
]
const meta = { title: 'Features/System/RulebooksTable', component: RulebooksTable } satisfies Meta<typeof RulebooksTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    rulebooks: [
      { id: 2, manufacturer: 'stellantis', version: 2, effective_from: '2026-07-30T00:00:00Z', effective_to: null, rules },
      {
        id: 1,
        manufacturer: 'stellantis',
        version: 1,
        effective_from: '2025-07-30T00:00:00Z',
        effective_to: '2026-07-30T00:00:00Z',
        rules: rules.slice(0, 1),
      },
    ],
  },
}
export const Empty: Story = { args: { rulebooks: [] } }
