<script setup lang="ts">
import { onMounted } from 'vue'
import { api } from '@/shared/api/client'
import type { BatchPreview, Resource } from '@/shared/api/types'
import BatchPreviewPanel from '@/shared/components/BatchPreview.vue'
import BatchReceipts from '@/shared/components/BatchReceipts.vue'
import { useBatch } from '@/shared/composables/useBatch'

const batch = useBatch()
onMounted(() => batch.load(async () => (await api<Resource<BatchPreview>>('/playbooks/bulk/preview')).data))
</script>

<template>
  <div class="ds-page-head">
    <h1>Bulk budget change</h1>
    <p class="ds-muted">Raise the daily budget of 300 campaigns by 10%. Review the preview, which writes nothing, then approve once.</p>
  </div>
  <div class="ds-stack">
    <BatchPreviewPanel
      item-label="Campaign"
      :status="batch.status.value"
      :preview="batch.preview.value"
      :error="batch.error.value"
      :applied-count="batch.appliedCount.value"
      :failures="batch.failures.value"
      :action-error="batch.actionError.value"
      :pending="batch.pending.value"
      @approve="batch.approve()"
      @retry="batch.retry()"
      @reload="batch.reload()"
    />
    <BatchReceipts :receipts="batch.receipts.value" :error="batch.receiptsError.value" />
  </div>
</template>
