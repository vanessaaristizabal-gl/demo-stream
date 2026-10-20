<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { LabDeploySettings, LabOem } from '@/shared/api/types'
import BulkApprovalPreview from '../components/BulkApprovalPreview.vue'
import DeployWizard from '../components/DeployWizard.vue'
import { useLabStore } from '../store'
import { useBatchApproval } from '../useBatchApproval'

const store = useLabStore()
const batch = useBatchApproval()

const step = ref<'accounts' | 'settings' | 'review'>('accounts')
const oem = ref<LabOem>('stellantis')
const accountIds = ref<number[]>([])
const settings = ref<LabDeploySettings>({ monthly_cap: 165000, pacing: 'even', status_at_write: 'paused' })

onMounted(() => store.fetchDeployOptions())

async function next(): Promise<void> {
  if (step.value === 'accounts') step.value = 'settings'
  else if (step.value === 'settings') {
    step.value = 'review'
    await store.previewDeploy({ oem: oem.value, account_ids: accountIds.value, settings: settings.value })
  }
}
const previous = (): void => void (step.value = step.value === 'review' ? 'settings' : 'accounts')

// Once something was written, show the receipts the governed path left in the changelog.
watch(
  () => store.appliedCount,
  (count) => {
    if (count > 0 && store.preview) void store.fetchReceipts(store.preview.batch_id)
  },
)
</script>

<template>
  <div class="ds-page-head">
    <h1>Deploy a playbook</h1>
    <p class="ds-muted">
      Core Models Search: pick the brand program and the accounts, set the budget, review a preview that writes nothing, then approve once.
    </p>
  </div>
  <DeployWizard
    v-model:oem="oem"
    v-model:account-ids="accountIds"
    v-model:settings="settings"
    :status="store.deployStatus"
    :step="step"
    :options="store.deployOptions"
    :error="store.deployError"
    :receipts="store.receipts"
    @next="next"
    @previous="previous"
    @reload="store.fetchDeployOptions()"
  >
    <template #review>
      <BulkApprovalPreview
        :status="store.previewStatus"
        :preview="store.preview"
        :error="store.previewError"
        :applied-count="store.appliedCount"
        :failures="store.failures"
        :action-error="batch.actionError.value"
        :pending="batch.pending.value"
        @approve="batch.approve()"
        @retry="batch.retry()"
        @reload="next()"
      />
    </template>
  </DeployWizard>
</template>
