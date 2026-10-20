<script setup lang="ts">
import { onMounted, onScopeDispose } from 'vue'
import type { LabRowsQuery } from '@/shared/api/types'
import { useIdempotencyKey } from '@/shared/composables/useIdempotencyKey'
import DenseList from '../components/DenseList.vue'
import { useLabStore } from '../store'

const store = useLabStore()
const { key, renew } = useIdempotencyKey()

onMounted(() => store.fetchRows())

// Typing in the search box would otherwise send one request per keystroke.
let timer: ReturnType<typeof setTimeout> | undefined
onScopeDispose(() => clearTimeout(timer))
function onQuery(next: LabRowsQuery): void {
  clearTimeout(timer)
  if (next.q !== store.query.q) timer = setTimeout(() => void store.fetchRows(next), 250)
  else void store.fetchRows(next)
}

// One key per edit intent. After a 429 the same edit may be retried with the same key; a different amount is a new intent.
let last: { id: number; cents: number } | null = null
async function onSave({ id, daily_budget }: { id: number; daily_budget: number }): Promise<void> {
  if (last?.id !== id || last.cents !== daily_budget) renew()
  last = { id, cents: daily_budget }
  if (await store.saveRow(id, daily_budget, key.value)) {
    last = null
    renew()
  }
}
</script>

<template>
  <div class="ds-page-head">
    <h1>Dense list</h1>
    <p class="ds-muted">2,000 campaigns. The server filters, sorts and pages; the browser holds one page.</p>
  </div>
  <DenseList
    :status="store.rowsStatus"
    :rows="store.rows"
    :total="store.total"
    :page-count="store.pageCount"
    :query="store.query"
    :error="store.rowsError"
    :saving-id="store.savingId"
    :messages="store.messages"
    @query="onQuery"
    @save="onSave"
    @reload="store.fetchRows()"
  />
</template>
