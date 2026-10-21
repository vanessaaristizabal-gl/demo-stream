import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import EmergencyStopPanel from './EmergencyStopPanel.vue'

const meta = {
  title: 'Features/System/EmergencyStopPanel',
  component: EmergencyStopPanel,
  args: { active: false, busy: false, onEngage: fn(), onResume: fn() },
} satisfies Meta<typeof EmergencyStopPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Enabled: Story = {}
export const Stopped: Story = { args: { active: true } }
export const Engaging: Story = { args: { busy: true } }
export const ResumeFailed: Story = { args: { active: true, error: 'The server could not be reached.' } }
