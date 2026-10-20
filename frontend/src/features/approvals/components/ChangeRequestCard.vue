<script setup lang="ts">
import { computed } from 'vue'
import { Check, X } from 'lucide-vue-next'
import { DsButton, DsCard, DsMessage } from '@/design-system'
import type { ChangeRequest } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import DiffTable from './DiffTable.vue'

const props = defineProps<{ request: ChangeRequest; canDecide?: boolean; busy?: boolean }>()
const emit = defineEmits<{ approve: [id: number]; reject: [id: number] }>()

interface Violation {
  rule_id: string
  message: string
}

const violations = computed(() => (props.request.failure?.violations as Violation[] | undefined) ?? [])
const awaiting = computed(() => props.request.status === 'pending_approval')
</script>

<template>
  <DsCard as="article" :aria-label="`Change request ${request.id}`">
    <div class="ds-stack">
      <header class="ds-row">
        <h2>{{ request.campaign?.name ?? `Campaign #${request.campaign_id}` }}</h2>
        <StatusBadge :status="request.status" />
        <span class="ds-muted"
          >requested by {{ request.requester?.name ?? 'unknown' }} on <DateText :value="request.created_at" mode="datetime"
        /></span>
      </header>

      <DiffTable :diff="request.diff" />

      <DsMessage v-if="violations.length" tone="danger">
        <ul class="violations" aria-label="Rule violations">
          <li v-for="v in violations" :key="v.rule_id">{{ v.rule_id }}: {{ v.message }}</li>
        </ul>
      </DsMessage>

      <p v-if="request.approver" class="ds-muted">Decided by {{ request.approver.name }}</p>

      <footer v-if="awaiting && canDecide" class="ds-row">
        <DsButton :icon="Check" :loading="busy" @click="emit('approve', request.id)">Approve</DsButton>
        <DsButton variant="danger" :icon="X" :loading="busy" @click="emit('reject', request.id)">Reject</DsButton>
      </footer>
    </div>
  </DsCard>
</template>

<style scoped>
.violations {
  margin: 0;
  padding-left: var(--ds-space-4);
}
</style>
