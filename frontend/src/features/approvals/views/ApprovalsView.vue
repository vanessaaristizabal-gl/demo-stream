<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ListChecks } from 'lucide-vue-next'
import { DsCard, DsEmptyState, DsMessage } from '@/design-system'
import { useAuthStore } from '@/features/auth/store'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import ChangeRequestCard from '../components/ChangeRequestCard.vue'
import { useChangeRequestsStore } from '../store'

const store = useChangeRequestsStore()
const auth = useAuthStore()

onMounted(() => store.fetchAll())

const canDecide = computed(() => auth.can('approver', 'admin'))
const approve = useAsyncAction((id: number) => store.approve(id))
const reject = useAsyncAction((id: number) => store.reject(id))
const busy = computed(() => approve.pending.value || reject.pending.value)
const errorMessage = computed(() => approve.error.value?.message ?? reject.error.value?.message ?? null)
</script>

<template>
  <div class="ds-page-head">
    <h1>Approvals</h1>
    <p class="ds-muted">Review proposed changes before they reach a live account.</p>
  </div>
  <div class="ds-stack">
    <DsMessage v-if="errorMessage" tone="danger">{{ errorMessage }}</DsMessage>
    <p v-if="store.loading" class="ds-muted" role="status">Loading change requests…</p>
    <DsCard v-else-if="store.items.length === 0">
      <DsEmptyState title="No change requests" :icon="ListChecks">Proposed changes will appear here for review.</DsEmptyState>
    </DsCard>
    <template v-else>
      <ChangeRequestCard
        v-for="r in store.items"
        :key="r.id"
        :request="r"
        :can-decide="canDecide"
        :busy="busy"
        @approve="approve.run"
        @reject="reject.run"
      />
    </template>
  </div>
</template>
