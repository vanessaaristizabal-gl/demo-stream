import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import type { LabDeploySettings } from '@/shared/api/types'
import { makeDeployOptions, makeReceipt } from '@/shared/test/factories'
import DeployWizard from './DeployWizard.vue'

const settings: LabDeploySettings = { monthly_cap: 165000, pacing: 'even', status_at_write: 'paused' }

const meta = {
  title: 'Features/Lab/DeployWizard',
  component: DeployWizard,
  args: {
    status: 'ready',
    step: 'accounts',
    options: makeDeployOptions(),
    receipts: [],
    oem: 'stellantis',
    accountIds: [1],
    settings,
    onNext: fn(),
    onPrevious: fn(),
    onReload: fn(),
  },
} satisfies Meta<typeof DeployWizard>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = { args: { status: 'loading', options: null } }
export const Error: Story = { args: { status: 'error', options: null, error: 'The deploy options could not be loaded (HTTP 500).' } }
export const Accounts: Story = {}
export const Settings: Story = { args: { step: 'settings' } }
export const Review: Story = { args: { step: 'review' } }
export const Receipts: Story = { args: { step: 'review', receipts: [makeReceipt(1), makeReceipt(2, { account: 'Best CDJR' })] } }
