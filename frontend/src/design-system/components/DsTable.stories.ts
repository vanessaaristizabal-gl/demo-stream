import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import DsPagination from './DsPagination.vue'
import DsTable from './DsTable.vue'
import DsTag from './DsTag.vue'
import { useTable } from '../composables/useTable'

const rows = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  name: ['Camry Spring', 'RAV4 Summer', 'Accord Lease', 'Civic Inventory'][i % 4] + ` ${i + 1}`,
  provider: i % 2 ? 'meta' : 'google',
  budget: 5000 + i * 1250,
}))

const columns = [
  { key: 'name', label: 'Campaign', sortable: true },
  { key: 'provider', label: 'Provider', sortable: true },
  { key: 'budget', label: 'Daily budget', sortable: true, align: 'end' as const },
]

// DsTable is generic over its row type, which Storybook's component typing cannot express: type the meta loosely.
const meta: Meta = { title: 'Design System/Table', component: DsTable as never }
export default meta
type Story = StoryObj

export const Sortable: Story = {
  render: () => ({
    components: { DsTable, DsTag },
    setup: () => ({ columns, rows: rows.slice(0, 5), sort: { key: 'name', dir: 'asc' } }),
    template: `<DsTable v-model:sort="sort" :columns="columns" :rows="rows" row-key="id" caption="Campaigns">
      <template #cell-provider="{ row }"><DsTag tone="info">{{ row.provider }}</DsTag></template>
      <template #cell-budget="{ value }">$ {{ (value / 100).toFixed(2) }}</template>
    </DsTable>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Daily budget/ }))
    await expect(canvas.getByRole('columnheader', { name: /Daily budget/ })).toHaveAttribute('aria-sort', 'ascending')
  },
}

export const WithPagination: Story = {
  render: () => ({
    components: { DsTable, DsPagination },
    setup() {
      const t = useTable(rows, { pageSize: 5, initialSort: { key: 'name', dir: 'asc' } })
      return { columns, ...t }
    },
    template: `<div>
      <DsTable v-model:sort="sort" :columns="columns" :rows="pageRows" row-key="id" caption="Campaigns" />
      <DsPagination v-model:page="page" :page-count="pageCount" />
    </div>`,
  }),
}

export const Empty: Story = {
  render: () => ({
    components: { DsTable },
    setup: () => ({ columns }),
    template:
      '<DsTable :columns="columns" :rows="[]" row-key="id" caption="Campaigns"><template #empty>No campaigns match your search.</template></DsTable>',
  }),
}
