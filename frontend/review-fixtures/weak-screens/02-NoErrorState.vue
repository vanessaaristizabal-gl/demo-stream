<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/api/client'
import type { BatchPreview, Resource } from '@/shared/api/types'

const preview = ref<BatchPreview | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    preview.value = (await api<Resource<BatchPreview>>('/playbooks/bulk/preview')).data
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
    <li v-for="item in preview?.items" :key="item.id">{{ item.label }}: {{ item.after }}</li>
  </ul>
</template>
