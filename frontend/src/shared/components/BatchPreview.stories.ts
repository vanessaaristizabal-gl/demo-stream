import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import type { BatchFailure } from '@/shared/api/types'
import { makeBatchPreview } from '@/shared/test/factories'
import BatchPreview from './BatchPreview.vue'

const failures: BatchFailure[] = [
  { id: 1, code: 'rate_limited', message: 'Provider rate limit reached. Retry in 30 seconds.', retryable: true },
  { id: 2, code: 'provider_rejected', message: 'Provider rejected the update: the campaign is in its learning phase.', retryable: true },
]

const meta = {
  title: 'Shared/BatchPreview',
  component: BatchPreview,
  args: {
    status: 'ready',
    preview: makeBatchPreview(),
    appliedCount: 0,
    failures: [],
    pending: false,
    onApprove: fn(),
    onRetry: fn(),
    onReload: fn(),
  },
} satisfies Meta<typeof BatchPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = { args: { status: 'loading', preview: null } }
export const Error: Story = { args: { status: 'error', preview: null, error: 'The preview could not be loaded (HTTP 500).' } }
export const Empty: Story = { args: { preview: makeBatchPreview({ ready: 0, held: 0 }) } }
export const Ready: Story = {}
export const Applying: Story = { args: { pending: true } }
export const PartialFailure: Story = { args: { appliedCount: 28, failures } }
export const Success: Story = { args: { appliedCount: 30, failures: [] } }
