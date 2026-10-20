<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignsStore } from '../store'
import CampaignTable from '../components/CampaignTable.vue'

const store = useCampaignsStore()
const router = useRouter()

onMounted(() => store.fetchAll())
</script>

<template>
  <div class="ds-page-head">
    <h1>Campaigns</h1>
    <p class="ds-muted">Every campaign across your Google Ads and Meta accounts.</p>
  </div>
  <p v-if="store.loading" class="ds-muted" role="status">Loading campaigns…</p>
  <CampaignTable v-else :campaigns="store.items" @select="(id) => router.push({ name: 'campaign', params: { id } })" />
</template>
