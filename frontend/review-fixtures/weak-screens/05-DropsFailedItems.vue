<script setup lang="ts">
import { ref } from 'vue'
import { DsButton, DsMessage } from '@/design-system'
import { api } from '@/shared/api/client'
import type { LabApplyResult, Resource } from '@/shared/api/types'

const applied = ref<number[]>([])
const error = ref<string | null>(null)

async function approve(): Promise<void> {
  try {
    const result = (await api<Resource<LabApplyResult>>('/lab/bulk/apply', { method: 'POST', body: { batch_id: 'batch-1' }, headers: { 'Idempotency-Key': crypto.randomUUID() } })).data
    applied.value = result.applied
  } catch (e) {
    error.value = (e as Error).message
  }
}
</script>

<template>
  <DsButton @click="approve">Approve</DsButton>
  <DsMessage v-if="error" tone="danger">{{ error }}</DsMessage>
  <DsMessage v-if="applied.length" tone="success">Done: {{ applied.length }} budgets updated.</DsMessage>
  <ul>
    <li v-for="id in applied" :key="id">Item {{ id }} applied</li>
  </ul>
</template>
