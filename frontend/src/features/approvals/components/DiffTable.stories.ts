import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DiffTable from './DiffTable.vue'

const meta = { title: 'Features/Approvals/DiffTable', component: DiffTable } satisfies Meta<typeof DiffTable>

export default meta
type Story = StoryObj<typeof meta>

export const BudgetAndStatus: Story = {
  args: { diff: { daily_budget: { old: 10000, new: 12500 }, status: { old: 'active', new: 'paused' } } },
}
export const Empty: Story = { args: { diff: {} } }
