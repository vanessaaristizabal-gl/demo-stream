import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import { makeAccount, makeLaunchPlan } from '@/shared/test/factories'
import { defaultSettings } from './defaults'
import LaunchWizard from './LaunchWizard.vue'

const account = makeAccount()
const meta = {
  title: 'Features/Accounts/LaunchWizard',
  component: LaunchWizard,
  args: {
    status: 'ready',
    step: 'playbook',
    plan: makeLaunchPlan(),
    account,
    oem: 'stellantis',
    campaignIds: [1, 2, 3, 4, 5],
    settings: defaultSettings(account),
    onNext: fn(),
    onPrevious: fn(),
    onReload: fn(),
  },
} satisfies Meta<typeof LaunchWizard>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = { args: { status: 'loading', plan: null } }
export const Error: Story = { args: { status: 'error', plan: null, error: 'The playbook could not be loaded (HTTP 500).' } }
export const Playbook: Story = {}
export const Settings: Story = { args: { step: 'settings' } }
export const NoBudget: Story = {
  args: {
    step: 'settings',
    account: makeAccount({ monthly_budget: null }),
    settings: defaultSettings(makeAccount({ monthly_budget: null })),
  },
}
export const Review: Story = { args: { step: 'review' } }
