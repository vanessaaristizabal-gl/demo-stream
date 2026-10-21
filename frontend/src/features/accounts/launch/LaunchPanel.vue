<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/api/client'
import type { Account, BatchPreview, LaunchPlan, LaunchOem, LaunchSettings, Resource } from '@/shared/api/types'
import BatchPreviewPanel from '@/shared/components/BatchPreview.vue'
import BatchReceipts from '@/shared/components/BatchReceipts.vue'
import { useBatch } from '@/shared/composables/useBatch'
import { defaultOem, defaultSettings } from './defaults'
import LaunchWizard from './LaunchWizard.vue'

const props = defineProps<{ account: Account }>()

const plan = ref<LaunchPlan | null>(null)
const planStatus = ref<'loading' | 'error' | 'ready'>('loading')
const planError = ref<string | null>(null)
const batch = useBatch()

// The draft belongs to this account's tab: it is kept while the person moves between tabs, and starts from the account's own values.
const step = ref<'playbook' | 'settings' | 'review'>('playbook')
const oem = ref<LaunchOem>(defaultOem(props.account))
const campaignIds = ref<number[]>([])
const settings = ref<LaunchSettings>(defaultSettings(props.account))

async function loadPlan(): Promise<void> {
  planStatus.value = 'loading'
  planError.value = null
  try {
    plan.value = (await api<Resource<LaunchPlan>>('/playbooks/launch/plan')).data
    campaignIds.value = plan.value.campaigns.map((c) => c.id)
    planStatus.value = 'ready'
  } catch (e) {
    planError.value = e instanceof Error ? e.message : 'The playbook could not be loaded.'
    planStatus.value = 'error'
  }
}
onMounted(loadPlan)

const buildPreview = async (): Promise<BatchPreview> =>
  (
    await api<Resource<BatchPreview>>('/playbooks/launch/preview', {
      method: 'POST',
      body: {
        account: {
          id: props.account.id,
          name: props.account.dealer_name,
          manufacturer: props.account.manufacturer,
          monthly_budget: props.account.monthly_budget,
        },
        oem: oem.value,
        campaign_ids: campaignIds.value,
        settings: settings.value,
      },
    })
  ).data

async function next(): Promise<void> {
  if (step.value === 'playbook') step.value = 'settings'
  else if (step.value === 'settings') {
    step.value = 'review'
    await batch.load(buildPreview)
  }
}
const previous = (): void => void (step.value = step.value === 'review' ? 'settings' : 'playbook')
</script>

<template>
  <LaunchWizard
    v-model:oem="oem"
    v-model:campaign-ids="campaignIds"
    v-model:settings="settings"
    :status="planStatus"
    :step="step"
    :plan="plan"
    :account="account"
    :error="planError"
    @next="next"
    @previous="previous"
    @reload="loadPlan"
  >
    <template #review>
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
    </template>
  </LaunchWizard>
</template>
