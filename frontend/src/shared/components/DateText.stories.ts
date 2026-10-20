import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DateText from './DateText.vue'

const meta = { title: 'Shared/DateText', component: DateText, args: { value: '2026-10-15T16:07:03+00:00', mode: 'date' } } satisfies Meta<
  typeof DateText
>

export default meta
type Story = StoryObj<typeof meta>

export const DateOnly: Story = {}
export const WithTime: Story = { args: { mode: 'datetime' } }
export const Missing: Story = { args: { value: null } }
