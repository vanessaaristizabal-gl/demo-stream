import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { makeCampaign } from '@/shared/test/factories'
import ChangeForm from './ChangeForm.vue'

const meta = {
  title: 'Features/Campaigns/ChangeForm',
  component: ChangeForm,
  args: { campaign: makeCampaign(), onSubmit: fn() },
} satisfies Meta<typeof ChangeForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const budget = canvas.getByLabelText('Daily budget (USD)')
    await userEvent.clear(budget)
    await userEvent.type(budget, '150')
    await userEvent.click(canvas.getByRole('button', { name: 'Submit for approval' }))
    await expect(args.onSubmit).toHaveBeenCalledWith({ daily_budget: 15000 })
  },
}

export const WithLockedFields: Story = { args: { campaign: makeCampaign({ locks: ['name', 'daily_budget'] }) } }
export const WithServerError: Story = { args: { errorMessage: 'Emergency stop is active: no writes are accepted.' } }
export const Submitting: Story = { args: { pending: true } }
