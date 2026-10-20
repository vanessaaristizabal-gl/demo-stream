import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import EmergencyStopButton from './EmergencyStopButton.vue'

const meta = { title: 'Features/System/EmergencyStopButton', component: EmergencyStopButton, args: { onEngage: fn() } } satisfies Meta<
  typeof EmergencyStopButton
>

export default meta
type Story = StoryObj<typeof meta>

export const AsksBeforeEngaging: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Emergency stop' }))
    const dialog = within(document.body).getByRole('alertdialog', { name: 'Stop all writes?' })
    await expect(args.onEngage).not.toHaveBeenCalled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Engage emergency stop' }))
    await expect(args.onEngage).toHaveBeenCalledOnce()
  },
}
