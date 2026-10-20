<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RotateCw } from 'lucide-vue-next'
import { DsButton, DsConfirmDialog, DsMessage, DsTabs } from '@/design-system'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import { useIdempotencyKey } from '@/shared/composables/useIdempotencyKey'
import { useTabQuery } from '@/shared/composables/useTabQuery'
import CampaignsPanel from '../components/CampaignsPanel.vue'
import { fromLive, fromSimulated, type CampaignRow } from '../rows'
import { useSandboxStore } from '../simulated/store'
import { useCampaignsStore } from '../store'

const live = useCampaignsStore()
const simulated = useSandboxStore()
const router = useRouter()

const loadError = ref<string | null>(null)
async function load(): Promise<void> {
  loadError.value = null
  try {
    await Promise.all([live.fetchAll(), simulated.fetchAll(), simulated.platforms.length ? undefined : simulated.fetchCatalog()])
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'The campaigns could not be loaded.'
  }
}
onMounted(load)

// One tab per provider: a strategist works on one platform at a time. The tab lives in the URL.
const tab = useTabQuery(['google', 'meta'] as const, 'google')
const rows = computed<CampaignRow[]>(() => [...live.items.map(fromLive), ...simulated.items.map(fromSimulated)])
const byProvider = (provider: 'google' | 'meta') => rows.value.filter((r) => r.provider === provider)
const tabs = computed(() => [
  { value: 'google', label: 'Google Ads', count: byProvider('google').length },
  { value: 'meta', label: 'Meta Ads', count: byProvider('meta').length },
])
const platformOf = (provider: 'google' | 'meta') => simulated.platforms.find((p) => p.platform === provider)

function open(row: CampaignRow): void {
  void (row.kind === 'live'
    ? router.push({ name: 'campaign', params: { id: row.id } })
    : router.push({ name: 'campaign-simulated', params: { id: row.id } }))
}
// Live: the change form (a change request that needs approval). Simulated: its settings tab, saved directly.
function edit(row: CampaignRow): void {
  void (row.kind === 'live'
    ? router.push({ name: 'campaign', params: { id: row.id } })
    : router.push({ name: 'campaign-simulated', params: { id: row.id }, query: { tab: 'settings' } }))
}
const create = (): void => void router.push({ name: 'campaign-new', query: { platform: tab.value } })

// Delete: simulated campaigns only, after a confirmation. The key is kept while a delete fails so retrying is safe.
const { key, renew } = useIdempotencyKey()
const pendingDelete = ref<CampaignRow | null>(null)
const confirming = ref(false)
const deleted = ref<string | null>(null)
const heading = ref<HTMLElement | null>(null)
const remove = useAsyncAction(async () => {
  const row = pendingDelete.value
  if (!row) return
  await simulated.remove(row.id, key.value)
  renew()
  deleted.value = row.name
  confirming.value = false
  await nextTick()
  heading.value?.focus() // the row that held focus is gone: land on the page heading
})
function askToDelete(row: CampaignRow): void {
  pendingDelete.value = row
  deleted.value = null
  confirming.value = true
}
</script>

<template>
  <div class="ds-page-head">
    <h1 ref="heading" tabindex="-1">Campaigns</h1>
    <p class="ds-muted">Every campaign across your Google Ads and Meta accounts, live and simulated, one provider at a time.</p>
  </div>

  <p v-if="live.loading || simulated.loading" class="ds-muted" role="status">Loading campaigns…</p>
  <DsMessage v-else-if="loadError" tone="danger">
    <p>{{ loadError }}</p>
    <DsButton variant="secondary" size="sm" :icon="RotateCw" @click="load">Try again</DsButton>
  </DsMessage>
  <div v-else class="ds-stack">
    <DsMessage v-if="deleted" tone="success">Deleted {{ deleted }}.</DsMessage>
    <DsTabs v-model="tab" label="Providers" :items="tabs">
      <template #panel-google>
        <CampaignsPanel
          :rows="byProvider('google')"
          :platform="platformOf('google')"
          @open="open"
          @edit="edit"
          @remove="askToDelete"
          @create="create"
        />
      </template>
      <template #panel-meta>
        <CampaignsPanel
          :rows="byProvider('meta')"
          :platform="platformOf('meta')"
          @open="open"
          @edit="edit"
          @remove="askToDelete"
          @create="create"
        />
      </template>
    </DsTabs>
  </div>

  <DsConfirmDialog
    v-model:open="confirming"
    title="Delete this simulated campaign?"
    :description="`${pendingDelete?.name ?? 'The campaign'} and its simulated metrics will be removed. It never existed in a real account.`"
    confirm-label="Delete campaign"
    tone="danger"
    :loading="remove.pending.value"
    :error="remove.error.value?.message ?? null"
    @confirm="remove.run()"
  />
</template>
