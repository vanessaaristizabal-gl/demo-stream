import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import PageNav from './PageNav.vue'

const meta = {
  title: 'Layout/PageNav',
  component: PageNav,
  args: { canGoBack: true, onBack: fn(), onNavigate: fn() },
} satisfies Meta<typeof PageNav>

export default meta
type Story = StoryObj<typeof meta>

export const CampaignDetail: Story = {
  args: {
    crumbs: [
      { label: 'Home', href: '/campaigns' },
      { label: 'Campaigns', href: '/campaigns' },
      { label: 'Spring Camry', href: '/campaigns/1' },
    ],
  },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Back' }))
    await expect(args.onBack).toHaveBeenCalledOnce()
  },
}

export const TopLevelWithoutHistory: Story = {
  args: {
    canGoBack: false,
    crumbs: [
      { label: 'Home', href: '/campaigns' },
      { label: 'Approvals', href: '/approvals' },
    ],
  },
}
