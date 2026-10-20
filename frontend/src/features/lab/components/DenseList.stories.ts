import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { labQuery, makeLabRow } from '@/shared/test/factories'
import DenseList from './DenseList.vue'

const rows = Array.from({ length: 12 }, (_, i) =>
  makeLabRow(i + 1, {
    status: (['active', 'paused', 'limited', 'ended'] as const)[i % 4],
    daily_budget: 3000 + i * 250,
    locked_reason: i === 9 ? 'Locked by brand.' : null,
  }),
)

const meta = {
  title: 'Features/Lab/DenseList',
  component: DenseList,
  args: {
    status: 'ready',
    rows,
    total: 2000,
    pageCount: 40,
    query: labQuery,
    savingId: null,
    messages: {},
    onQuery: fn(),
    onSave: fn(),
    onReload: fn(),
  },
} satisfies Meta<typeof DenseList>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = { args: { status: 'loading', rows: [] } }
export const Error: Story = { args: { status: 'error', rows: [], error: 'The campaigns could not be loaded (HTTP 500).' } }
export const Empty: Story = { args: { rows: [], total: 0, pageCount: 1, query: { ...labQuery, q: 'zzz' } } }
export const Ready: Story = {}
export const Saving: Story = { args: { savingId: 3 } }
export const Locked: Story = {
  args: { messages: { 10: { kind: 'locked', text: 'Locked by manufacturer rule: this budget is set by the brand programme.' } } },
}
export const RateLimited: Story = { args: { messages: { 3: { kind: 'rate-limited', text: 'Too many edits. Retry in 7 seconds.' } } } }
