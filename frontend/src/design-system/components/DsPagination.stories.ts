import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import DsPagination from './DsPagination.vue'

const meta = {
  title: 'Design System/Pagination',
  component: DsPagination,
  args: { pageCount: 5, page: 2 },
  render: (args) => ({
    components: { DsPagination },
    setup: () => ({ args, page: ref(2) }),
    template: '<DsPagination v-bind="args" v-model:page="page" />',
  }),
} satisfies Meta<typeof DsPagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }))
    await expect(canvas.getByText('Page 3 of 5')).toBeInTheDocument()
  },
}
