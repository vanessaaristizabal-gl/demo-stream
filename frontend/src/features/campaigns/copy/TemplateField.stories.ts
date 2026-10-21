import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { DEALERS } from './dealers'
import TemplateField from './TemplateField.vue'

const meta = {
  title: 'Features/Lab/TemplateField',
  component: TemplateField,
  args: { dealers: DEALERS, dealerId: 'acme', modelValue: '' },
} satisfies Meta<typeof TemplateField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Valid: Story = { args: { modelValue: '{{ dealer.name }} - 0% APR' } }
export const OverLimit: Story = { args: { modelValue: '{{ dealer.name }} - 0% APR this month only!' } }
export const UnknownPlaceholder: Story = { args: { modelValue: '{{ dealer.nme }} - 0% APR' } }
