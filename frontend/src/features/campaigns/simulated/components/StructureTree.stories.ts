import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { makePlatformCatalog, makeSandboxDetail } from '@/shared/test/factories'
import StructureTree from './StructureTree.vue'

const [google, meta] = makePlatformCatalog()

const storyMeta = { title: 'Features/Sandbox/StructureTree', component: StructureTree } satisfies Meta<typeof StructureTree>

export default storyMeta
type Story = StoryObj<typeof storyMeta>

export const GoogleAds: Story = { args: { campaign: makeSandboxDetail(), platform: google } }
export const MetaAds: Story = {
  args: {
    platform: meta,
    campaign: makeSandboxDetail({
      platform: 'meta',
      structure: {
        campaign: { id: '100000000000001', objective: 'OUTCOME_LEADS', buying_type: 'AUCTION', special_ad_categories: [] },
        groups: [
          {
            kind: 'ad_set',
            id: '100000000000002',
            name: 'Local audience - Dallas',
            status: 'ACTIVE',
            daily_budget: 4500,
            optimization_goal: 'LEAD_GENERATION',
            targeting: { age_min: 25, age_max: 65, geo_locations: { cities: [{ name: 'Dallas' }] } },
            ads: [
              {
                id: '100000000000052',
                name: 'RAV4 - Image ad',
                status: 'ACTIVE',
                creative: { object_story_spec: { link_data: { call_to_action: { type: 'GET_QUOTE' } } } },
              },
            ],
          },
        ],
      },
    }),
  },
}
