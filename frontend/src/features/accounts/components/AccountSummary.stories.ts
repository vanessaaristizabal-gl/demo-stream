import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import AccountSummary from './AccountSummary.vue'

const meta = {
  title: 'Features/Accounts/AccountSummary',
  component: AccountSummary,
  args: {
    status: 'ready',
    name: 'Schrute CDJR',
    pace: 'on-pace',
    oem: 'Stellantis',
    tier: 'King',
    strategist: 'Jim Halpert',
    accountCode: 'ADV-SCHCDJR',
    googleAdsCustomerId: '742-118-9930',
    allocatedBudget: 555000,
    spendToday: 19300,
    monthToDateSpend: 348000,
    availableSpend: 207000,
    auditing: false,
    onReload: fn(),
    onAudit: fn(),
  },
} satisfies Meta<typeof AccountSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = { args: { status: 'loading' } }

export const Error: Story = { args: { status: 'error', error: 'The account could not be loaded. Check your connection.' } }

export const OnPace: Story = {}

export const Underpacing: Story = { args: { pace: 'underpacing', monthToDateSpend: 124000, availableSpend: 431000 } }

export const Overspending: Story = { args: { pace: 'overspending', monthToDateSpend: 567000, availableSpend: -12000 } }

/** AC-9: Salesforce has no budget for this account yet. */
export const NoBudget: Story = { args: { allocatedBudget: 0, availableSpend: 0, monthToDateSpend: 0, spendToday: 0 } }

/** AC-7: an audit is running; the control is disabled and busy. */
export const Auditing: Story = { args: { auditing: true } }
