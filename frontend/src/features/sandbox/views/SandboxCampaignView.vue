<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DsTag } from '@/design-system'
import type { SandboxCampaignDetail } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useCrumbLabel } from '@/shared/composables/useBreadcrumbs'
import { formatMoney } from '@/shared/utils/format'
import MetricsPanel from '../components/MetricsPanel.vue'
import StructureTree from '../components/StructureTree.vue'
import { useSandboxStore } from '../store'

const props = defineProps<{ id: number }>()

const store = useSandboxStore()
const campaign = ref<SandboxCampaignDetail | null>(null)
const platform = computed(() => store.platforms.find((p) => p.platform === campaign.value?.platform))

useCrumbLabel(() => campaign.value?.name)

// The route reuses this component between campaigns, so follow the id instead of loading once on mount.
watch(
  () => props.id,
  async (id) => {
    campaign.value = null
    const [detail] = await Promise.all([store.fetchOne(id), store.platforms.length ? undefined : store.fetchCatalog()])
    campaign.value = detail
  },
  { immediate: true },
)
</script>

<template>
  <p v-if="!campaign" class="ds-muted" role="status">Loading simulated campaign…</p>
  <div v-else class="ds-stack">
    <div class="ds-page-head">
      <h1 class="ds-row">{{ campaign.name }} <StatusBadge :status="campaign.status" /></h1>
      <p class="ds-muted ds-row">
        <DsTag tone="info">{{ campaign.platform }}</DsTag>
        <span
          >{{ platform?.label }} id {{ campaign.external_id }} · {{ formatMoney(campaign.daily_budget) }} per day · Created
          <DateText :value="campaign.created_at"
        /></span>
      </p>
    </div>
    <StructureTree :campaign="campaign" :platform="platform" />
    <MetricsPanel :campaign="campaign" :platform="platform" />
  </div>
</template>
