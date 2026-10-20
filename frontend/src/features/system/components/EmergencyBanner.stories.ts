import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import EmergencyBanner from './EmergencyBanner.vue'

const meta = { title: 'Features/System/EmergencyBanner', component: EmergencyBanner, args: { onResume: fn() } } satisfies Meta<
  typeof EmergencyBanner
>

export default meta
type Story = StoryObj<typeof meta>

export const ForAdmin: Story = { args: { canResume: true } }
export const ForStrategist: Story = { args: { canResume: false } }
export const Resuming: Story = { args: { canResume: true, busy: true } }
