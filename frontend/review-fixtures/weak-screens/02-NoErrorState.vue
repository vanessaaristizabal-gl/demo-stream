<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/api/client'
import type { LabPreview, Resource } from '@/shared/api/types'

const preview = ref<LabPreview | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    preview.value = (await api<Resource<LabPreview>>('/lab/bulk/preview')).data
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <p v-if="loading" role="status">Loading…</p>
  <ul v-else>
    <li v-for="item in preview?.items" :key="item.id">{{ item.account }}: {{ item.after }}</li>
  </ul>
</template>
