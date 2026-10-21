import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import AppHeader from './AppHeader.vue'

const meta = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  parameters: { layout: 'fullscreen' },
  args: {
    user: { id: 1, name: 'Ana Approver', email: 'approver@example.com', role: 'approver' },
    dark: false,
    onLogout: fn(),
    onToggleTheme: fn(),
  },
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Approver: Story = {}

export const Admin: Story = {
  args: { user: { id: 3, name: 'Adi Admin', email: 'admin@example.com', role: 'admin' } },
}

export const DarkToggle: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Switch to dark theme' }))
    await expect(args.onToggleTheme).toHaveBeenCalled()
  },
}
