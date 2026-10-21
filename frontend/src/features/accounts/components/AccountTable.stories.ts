import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { makeAccount } from '@/shared/test/factories'
import AccountTable from './AccountTable.vue'

const meta = { title: 'Features/Accounts/AccountTable', component: AccountTable, args: { onOpen: fn() } } satisfies Meta<
  typeof AccountTable
>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    accounts: [
      makeAccount(),
      makeAccount({ id: 2, provider: 'meta', dealer_name: 'Andy Mohr CDJR', monthly_budget: 420000, campaigns_count: 2 }),
      makeAccount({ id: 3, dealer_name: 'Lakeside Toyota', manufacturer: 'toyota', monthly_budget: null, campaigns_count: 1 }),
    ],
  },
}
export const Empty: Story = { args: { accounts: [] } }
