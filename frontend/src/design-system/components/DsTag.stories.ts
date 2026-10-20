import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DsTag from './DsTag.vue'

const meta = {
  title: 'Design System/Tag',
  component: DsTag,
  args: { tone: 'neutral' },
  argTypes: { tone: { control: 'radio', options: ['neutral', 'info', 'success', 'warning', 'danger'] } },
  render: (args) => ({ components: { DsTag }, setup: () => ({ args }), template: '<DsTag v-bind="args">Pending approval</DsTag>' }),
} satisfies Meta<typeof DsTag>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}
export const Info: Story = { args: { tone: 'info' } }
export const Success: Story = { args: { tone: 'success' } }
export const Warning: Story = { args: { tone: 'warning' } }
export const Danger: Story = { args: { tone: 'danger' } }

export const AllTones: Story = {
  render: () => ({
    components: { DsTag },
    template:
      '<div class="ds-row"><DsTag>neutral</DsTag><DsTag tone="info">info</DsTag><DsTag tone="success">success</DsTag><DsTag tone="warning">warning</DsTag><DsTag tone="danger">danger</DsTag></div>',
  }),
}
