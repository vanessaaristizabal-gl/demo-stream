import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { makePlatformCatalog } from '@/shared/test/factories'
import SandboxCampaignForm from './SandboxCampaignForm.vue'

const meta = {
  title: 'Features/Sandbox/SandboxCampaignForm',
  component: SandboxCampaignForm,
  args: { platforms: makePlatformCatalog(), onSubmit: fn() },
} satisfies Meta<typeof SandboxCampaignForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText(/Campaign name/), 'Camry spring')
    await userEvent.type(canvas.getByLabelText(/Vehicle model/), 'Camry')
    await userEvent.type(canvas.getByLabelText(/Target city/), 'Austin')
    await userEvent.type(canvas.getByLabelText(/Landing page/), 'https://dealer.example.com/camry')
    await userEvent.click(canvas.getByRole('button', { name: 'Create in sandbox' }))
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ platform: 'google', daily_budget: 15000, name: 'Camry spring' }),
    )
  },
}

export const MetaSelected: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('radio', { name: /Meta Ads/ }))
    await expect(within(canvasElement).getByRole('option', { name: /OUTCOME_AWARENESS/ })).toBeInTheDocument()
  },
}
export const WithServerError: Story = { args: { errorMessage: 'This Idempotency-Key was already used for a different campaign.' } }
export const Creating: Story = { args: { pending: true } }
