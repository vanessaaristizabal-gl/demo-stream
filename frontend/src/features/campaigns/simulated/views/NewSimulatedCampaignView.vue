<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DsMessage } from '@/design-system'
import type { SandboxCampaignInput, SandboxPlatform } from '@/shared/api/types'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import { useIdempotencyKey } from '@/shared/composables/useIdempotencyKey'
import SandboxCampaignForm from '../components/SandboxCampaignForm.vue'
import { useSandboxStore } from '../store'

const store = useSandboxStore()
const router = useRouter()
const route = useRoute()
const { key, renew } = useIdempotencyKey()

const platform = computed<SandboxPlatform>(() => (route.query.platform === 'meta' ? 'meta' : 'google'))

onMounted(() => {
  if (store.platforms.length === 0) void store.fetchCatalog()
})

const { run, pending, error } = useAsyncAction(async (input: SandboxCampaignInput) => {
  const created = await store.create(input, key.value)
  renew() // intent complete; the next campaign is a new request
  await router.replace({ name: 'campaign-simulated', params: { id: created.id } })
})
</script>

<template>
  <div class="ds-page-head">
    <h1>New simulated campaign</h1>
    <p class="ds-muted">See the structure and metrics a real platform would hold for it, without a real account.</p>
  </div>
  <div class="ds-stack">
    <DsMessage tone="info">
      Demo area: simulated campaigns never reach a real ad account and do not go through the governed write path.
    </DsMessage>
    <SandboxCampaignForm
      :platforms="store.platforms"
      :platform="platform"
      :pending="pending"
      :error-message="error?.message ?? null"
      @submit="run"
    />
  </div>
</template>
