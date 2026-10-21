<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RotateCw } from 'lucide-vue-next'
import { DsButton, DsMessage } from '@/design-system'
import AccountTable from '../components/AccountTable.vue'
import { useAccountsStore } from '../store'

const store = useAccountsStore()
const router = useRouter()

const error = ref<string | null>(null)
async function load(): Promise<void> {
  error.value = null
  try {
    await store.fetchAll()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'The accounts could not be loaded.'
  }
}
onMounted(load)
</script>

<template>
  <div class="ds-page-head">
    <h1>Accounts</h1>
    <p class="ds-muted">Every dealer account on Google Ads and Meta. Each account has its own monthly budget and its own campaigns.</p>
  </div>
  <p v-if="store.loading" class="ds-muted" role="status">Loading accounts…</p>
  <DsMessage v-else-if="error" tone="danger">
    <p>{{ error }}</p>
    <DsButton variant="secondary" size="sm" :icon="RotateCw" @click="load">Try again</DsButton>
  </DsMessage>
  <AccountTable v-else :accounts="store.items" @open="(a) => router.push({ name: 'account', params: { id: a.id } })" />
</template>
