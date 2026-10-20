import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Lock } from 'lucide-vue-next'
import { ref } from 'vue'
import DsSelect from './DsSelect.vue'

const options = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
]

const meta = {
  title: 'Design System/Select',
  component: DsSelect,
  args: { label: 'Status', options, modelValue: 'active' },
  render: (args) => ({
    components: { DsSelect },
    setup: () => ({ args, value: ref('active') }),
    template: '<DsSelect v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof DsSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true, hint: 'Locked: this field cannot be changed', hintIcon: Lock } }
