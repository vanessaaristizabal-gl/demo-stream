import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import DsBreadcrumb from './DsBreadcrumb.vue'

const meta = {
  title: 'Design System/Breadcrumb',
  component: DsBreadcrumb,
  args: {
    items: [
      { label: 'Home', href: '/campaigns' },
      { label: 'Campaigns', href: '/campaigns' },
      { label: 'Spring Camry', href: '/campaigns/1' },
    ],
    onNavigate: fn(),
  },
} satisfies Meta<typeof DsBreadcrumb>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('link', { name: 'Campaigns' }))
    await expect(args.onNavigate).toHaveBeenCalledWith({ label: 'Campaigns', href: '/campaigns' })
  },
}

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'Home', href: '/campaigns' },
      { label: 'Approvals', href: '/approvals' },
    ],
  },
}

export const LongLabel: Story = {
  args: {
    items: [
      { label: 'Home', href: '/campaigns' },
      { label: 'Campaigns', href: '/campaigns' },
      {
        label: 'Toyota Corolla Spring Clearance Event: 0% APR for 60 months, all trims, all dealers in the Southeast region',
        href: '/campaigns/1',
      },
    ],
  },
}
