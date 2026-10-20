<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2 } from 'lucide-vue-next'
import { DsButton, DsConfirmDialog, DsMessage, DsTabs, DsTag } from '@/design-system'
import type { SandboxCampaignDetail, SandboxCampaignUpdate } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import { useCrumbLabel } from '@/shared/composables/useBreadcrumbs'
import { useIdempotencyKey } from '@/shared/composables/useIdempotencyKey'
import { useTabQuery } from '@/shared/composables/useTabQuery'
import { formatMoney } from '@/shared/utils/format'
import MetricsPanel from '../components/MetricsPanel.vue'
import SandboxCampaignForm from '../components/SandboxCampaignForm.vue'
import StructureTree from '../components/StructureTree.vue'
import { useSandboxStore } from '../store'

const props = defineProps<{ id: number }>()

const store = useSandboxStore()
const router = useRouter()
const campaign = ref<SandboxCampaignDetail | null>(null)
const platform = computed(() => store.platforms.find((p) => p.platform === campaign.value?.platform))
const saved = ref(false)
const title = ref<HTMLElement | null>(null)

useCrumbLabel(() => campaign.value?.name)

// Results first (what a strategist opens this page for); the structure and the settings are one tab away.
const tab = useTabQuery(['metrics', 'structure', 'settings'] as const, 'metrics')
const tabs = [
  { value: 'metrics', label: 'Metrics' },
  { value: 'structure', label: 'Structure' },
  { value: 'settings', label: 'Settings' },
]

// The route reuses this component between campaigns, so follow the id instead of loading once on mount.
watch(
  () => props.id,
  async (id) => {
    campaign.value = null
    saved.value = false
    const [detail] = await Promise.all([store.fetchOne(id), store.platforms.length ? undefined : store.fetchCatalog()])
    campaign.value = detail
  },
  { immediate: true },
)

const edit = useIdempotencyKey()
const save = useAsyncAction(async (changes: SandboxCampaignUpdate) => {
  campaign.value = await store.update(props.id, changes, edit.key.value)
  edit.renew() // intent complete; the next edit is a new request
  saved.value = true
})

const removal = useIdempotencyKey()
const confirming = ref(false)
const remove = useAsyncAction(async () => {
  await store.remove(props.id, removal.key.value)
  removal.renew()
  confirming.value = false
  await router.replace({ name: 'campaigns' })
})
// A failed delete keeps the dialog open with the reason; the same key is kept so retrying is safe.
watch(confirming, async (open) => {
  if (open) return
  await nextTick()
  title.value?.focus()
})
</script>

<template>
  <p v-if="!campaign" class="ds-muted" role="status">Loading simulated campaign…</p>
  <div v-else class="ds-stack">
    <div class="ds-page-head head">
      <div>
        <h1 ref="title" tabindex="-1" class="ds-row">{{ campaign.name }} <StatusBadge :status="campaign.status" /></h1>
        <p class="ds-muted ds-row">
          <DsTag tone="info">{{ campaign.platform }}</DsTag>
          <DsTag tone="neutral">Simulated</DsTag>
          <span
            >{{ platform?.label }} id {{ campaign.external_id }} · {{ formatMoney(campaign.daily_budget) }} per day · Created
            <DateText :value="campaign.created_at"
          /></span>
        </p>
      </div>
      <DsButton variant="danger" :icon="Trash2" @click="confirming = true">Delete campaign</DsButton>
    </div>

    <DsTabs v-model="tab" label="Campaign sections" :items="tabs">
      <template #panel-metrics><MetricsPanel :campaign="campaign" :platform="platform" /></template>
      <template #panel-structure><StructureTree :campaign="campaign" :platform="platform" /></template>
      <template #panel-settings>
        <div class="ds-stack">
          <DsMessage v-if="saved" tone="success">Changes saved.</DsMessage>
          <SandboxCampaignForm
            :key="campaign.id"
            :platforms="store.platforms"
            :campaign="campaign"
            :pending="save.pending.value"
            :error-message="save.error.value?.message ?? null"
            @save="save.run($event)"
          />
        </div>
      </template>
    </DsTabs>

    <DsConfirmDialog
      v-model:open="confirming"
      title="Delete this simulated campaign?"
      :description="`${campaign.name} and its simulated metrics will be removed. It never existed in a real account, so nothing else changes.`"
      confirm-label="Delete campaign"
      tone="danger"
      :loading="remove.pending.value"
      :error="remove.error.value?.message ?? null"
      @confirm="remove.run()"
    />
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
}
</style>
