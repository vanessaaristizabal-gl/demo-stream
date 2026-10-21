<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, ListChecks, RotateCw } from 'lucide-vue-next'
import { DsButton, DsConfirmDialog, DsMessage, DsTabs } from '@/design-system'
import { useAuthStore } from '@/features/auth/store'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import { useIdempotencyKey } from '@/shared/composables/useIdempotencyKey'
import { useTabQuery } from '@/shared/composables/useTabQuery'
import ApprovalsTable from '../approvals/components/ApprovalsTable.vue'
import { useChangeRequestsStore } from '../approvals/store'
import CampaignsPanel from '../components/CampaignsPanel.vue'
import { fromLive, fromSimulated, type CampaignRow } from '../rows'
import { useSandboxStore } from '../simulated/store'
import { useCampaignsStore } from '../store'

const live = useCampaignsStore()
const simulated = useSandboxStore()
const requests = useChangeRequestsStore()
const auth = useAuthStore()
const router = useRouter()

const loadError = ref<string | null>(null)
async function load(): Promise<void> {
  loadError.value = null
  try {
    await Promise.all([
      live.fetchAll(),
      simulated.fetchAll(),
      requests.fetchAll(),
      simulated.platforms.length ? undefined : simulated.fetchCatalog(),
    ])
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'The campaigns could not be loaded.'
  }
}
onMounted(load)

// One tab per provider (a strategist works on one platform at a time) and one for the changes waiting for approval,
// whose count is always in the label so a pending change is never out of sight. The tab lives in the URL.
const tab = useTabQuery(['google', 'meta', 'approvals'] as const, 'google')
const rows = computed<CampaignRow[]>(() => [...live.items.map(fromLive), ...simulated.items.map(fromSimulated)])
const byProvider = (provider: 'google' | 'meta') => rows.value.filter((r) => r.provider === provider)
const tabs = computed(() => [
  { value: 'google', label: 'Google Ads', count: byProvider('google').length },
  { value: 'meta', label: 'Meta Ads', count: byProvider('meta').length },
  { value: 'approvals', label: 'Approvals', count: requests.pending.length },
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
const create = (): void => void router.push({ name: 'campaign-new', query: { platform: tab.value === 'meta' ? 'meta' : 'google' } })

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

// Approve or reject a change request from its row. Approving needs a different person than the requester (the server says so).
const canDecide = computed(() => auth.can('approver', 'admin'))
const busyId = ref<number | null>(null)
const decisionError = ref<string | null>(null)
async function decide(id: number, action: 'approve' | 'reject'): Promise<void> {
  busyId.value = id
  decisionError.value = null
  try {
    await (action === 'approve' ? requests.approve(id) : requests.reject(id))
  } catch (e) {
    decisionError.value = e instanceof Error ? e.message : 'The decision could not be saved.'
  } finally {
    busyId.value = null
  }
}

// These two operations run on a mock backend served by the development server, so their buttons exist only there.
const preview = import.meta.env.DEV
</script>

<template>
  <div class="ds-page-head head">
    <div>
      <h1 ref="heading" tabindex="-1">Campaigns</h1>
      <p class="ds-muted">Every campaign across your Google Ads and Meta accounts, live and simulated, one provider at a time.</p>
    </div>
    <div v-if="preview" class="ds-row">
      <DsButton variant="secondary" :icon="ListChecks" @click="router.push({ name: 'campaign-bulk' })">Bulk budget change</DsButton>
      <DsButton variant="secondary" :icon="FileText" @click="router.push({ name: 'campaign-copy' })">Ad copy</DsButton>
    </div>
  </div>

  <p v-if="live.loading || simulated.loading" class="ds-muted" role="status">Loading campaigns…</p>
  <DsMessage v-else-if="loadError" tone="danger">
    <p>{{ loadError }}</p>
    <DsButton variant="secondary" size="sm" :icon="RotateCw" @click="load">Try again</DsButton>
  </DsMessage>
  <div v-else class="ds-stack">
    <DsMessage v-if="deleted" tone="success">Deleted {{ deleted }}.</DsMessage>
    <DsTabs v-model="tab" label="Campaign sections" :items="tabs">
      <template #panel-google>
        <CampaignsPanel
          :rows="byProvider('google')"
          :platform="platformOf('google')"
          @open="open"
          @edit="edit"
          @remove="askToDelete"
          @account="(id) => router.push({ name: 'account', params: { id } })"
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
          @account="(id) => router.push({ name: 'account', params: { id } })"
          @create="create"
        />
      </template>
      <template #panel-approvals>
        <ApprovalsTable
          :requests="requests.items"
          :can-decide="canDecide"
          :busy-id="busyId"
          :error="decisionError"
          @approve="(id) => decide(id, 'approve')"
          @reject="(id) => decide(id, 'reject')"
          @open="(id) => router.push({ name: 'campaign', params: { id } })"
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

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
}
</style>
