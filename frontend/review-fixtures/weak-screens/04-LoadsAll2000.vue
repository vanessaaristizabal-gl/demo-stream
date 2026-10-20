<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { DsInput } from '@/design-system'
import { api } from '@/shared/api/client'
import type { LabRow } from '@/shared/api/types'

const rows = ref<LabRow[]>([])
const error = ref<string | null>(null)
const search = ref('')

onMounted(async () => {
  try {
    rows.value = (await api<{ data: LabRow[] }>('/lab/rows?per_page=2000')).data
  } catch (e) {
    error.value = (e as Error).message
  }
})

const visible = computed(() => rows.value.filter((r) => r.name.toLowerCase().includes(search.value.toLowerCase())))
</script>

<template>
  <p v-if="error" role="alert">{{ error }}</p>
  <DsInput v-model="search" label="Search" />
  <ul>
    <li v-for="r in visible" :key="r.id">{{ r.name }} - {{ r.status }}</li>
  </ul>
</template>
