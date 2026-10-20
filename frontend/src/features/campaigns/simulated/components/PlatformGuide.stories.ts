import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { makePlatformCatalog } from '@/shared/test/factories'
import PlatformGuide from './PlatformGuide.vue'

const meta = { title: 'Features/Sandbox/PlatformGuide', component: PlatformGuide } satisfies Meta<typeof PlatformGuide>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { platforms: makePlatformCatalog() } }
export const Loading: Story = { args: { platforms: [] } }
