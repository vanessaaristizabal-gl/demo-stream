<script setup lang="ts">
import { onMounted } from 'vue'
import BulkApprovalPreview from '../components/BulkApprovalPreview.vue'
import { useLabStore } from '../store'
import { useBatchApproval } from '../useBatchApproval'

const store = useLabStore()
const batch = useBatchApproval()

onMounted(() => store.fetchPreview())
</script>

<template>
  <div class="ds-page-head">
    <h1>Bulk approval preview</h1>
    <p class="ds-muted">Raise the daily budget of 300 campaigns by 10%. Review the preview, then approve once.</p>
  </div>
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
    @reload="store.fetchPreview()"
  />
</template>
