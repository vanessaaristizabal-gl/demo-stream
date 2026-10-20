<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DsMessage } from '@/design-system'
import type { SandboxCampaignInput } from '@/shared/api/types'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import { useIdempotencyKey } from '@/shared/composables/useIdempotencyKey'
import PlatformGuide from '../components/PlatformGuide.vue'
import SandboxCampaignForm from '../components/SandboxCampaignForm.vue'
import SandboxCampaignTable from '../components/SandboxCampaignTable.vue'
import { useSandboxStore } from '../store'

const store = useSandboxStore()
const router = useRouter()
const { key, renew } = useIdempotencyKey()

onMounted(() => Promise.all([store.fetchAll(), store.fetchCatalog()]))

const { run, pending, error } = useAsyncAction(async (input: SandboxCampaignInput) => {
  const created = await store.create(input, key.value)
  renew() // intent complete; the next campaign is a new request
  await router.push({ name: 'sandbox-campaign', params: { id: created.id } })
})
const errorMessage = computed(() => error.value?.message ?? null)
</script>

<template>
  <div class="ds-page-head">
    <h1>Sandbox</h1>
    <p class="ds-muted">Create simulated Google Ads and Meta campaigns and see the structure and metrics a real platform would hold.</p>
  </div>
  <div class="ds-stack">
    <DsMessage tone="info">
      Demo area: campaigns here are simulated. They never reach a real ad account and do not go through the governed write path.
    </DsMessage>
    <SandboxCampaignForm :platforms="store.platforms" :pending="pending" :error-message="errorMessage" @submit="run" />
    <p v-if="store.loading" class="ds-muted" role="status">Loading simulated campaigns…</p>
    <SandboxCampaignTable v-else :campaigns="store.items" @select="(id) => router.push({ name: 'sandbox-campaign', params: { id } })" />
    <PlatformGuide :platforms="store.platforms" />
  </div>
</template>
