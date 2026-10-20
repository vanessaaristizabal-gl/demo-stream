<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DsMessage } from '@/design-system'
import type { Campaign, CampaignFields, ChangeRequest } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useCrumbLabel } from '@/shared/composables/useBreadcrumbs'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import { useIdempotencyKey } from '@/shared/composables/useIdempotencyKey'
import ChangeForm from '../components/ChangeForm.vue'
import { useCampaignsStore } from '../store'

const props = defineProps<{ id: number }>()

const store = useCampaignsStore()
const campaign = ref<Campaign | null>(null)
const submitted = ref<ChangeRequest | null>(null)
const { key, renew } = useIdempotencyKey()

// The breadcrumb shows the campaign's name once it has loaded.
useCrumbLabel(() => campaign.value?.name)

// The route reuses this component between campaigns, so follow the id instead of loading once on mount.
watch(
  () => props.id,
  async (id) => {
    campaign.value = null
    submitted.value = null
    campaign.value = await store.fetchOne(id)
  },
  { immediate: true },
)

const { run, pending, error } = useAsyncAction(async (changes: Partial<CampaignFields>) => {
  submitted.value = await store.submitChange(props.id, changes, key.value)
  renew() // intent complete; the next edit is a new request
})

const errorMessage = computed(() => error.value?.message ?? null)
</script>

<template>
  <p v-if="!campaign" class="ds-muted" role="status">Loading campaign…</p>
  <div v-else class="ds-stack">
    <div class="ds-page-head">
      <h1 class="ds-row">{{ campaign.name }} <StatusBadge :status="campaign.status" /></h1>
      <p class="ds-muted">
        {{ campaign.account?.dealer_name }} · {{ campaign.account?.provider }} · {{ campaign.type }} · Created
        <DateText :value="campaign.created_at" />
      </p>
    </div>
    <ChangeForm :campaign="campaign" :pending="pending" :error-message="errorMessage" @submit="run" />
    <DsMessage v-if="submitted" tone="success">
      Change #{{ submitted.id }} submitted: <StatusBadge :status="submitted.status" />
    </DsMessage>
  </div>
</template>
