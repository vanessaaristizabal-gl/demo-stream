<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Lock, Send } from 'lucide-vue-next'
import { DsButton, DsCard, DsInput, DsMessage, DsSelect } from '@/design-system'
import type { Campaign, CampaignFields } from '@/shared/api/types'

const props = defineProps<{ campaign: Campaign; pending?: boolean; errorMessage?: string | null }>()
const emit = defineEmits<{ submit: [changes: Partial<CampaignFields>] }>()

interface Draft {
  name: string
  status: string
  dailyBudget: string
}

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
]

function fromCampaign(c: Campaign): Draft {
  const budget = c.live.daily_budget
  return { name: c.live.name ?? c.name, status: c.live.status ?? c.status, dailyBudget: budget == null ? '' : String(budget / 100) }
}

const draft = reactive<Draft>(fromCampaign(props.campaign))
watch(
  () => props.campaign,
  (c) => Object.assign(draft, fromCampaign(c)),
)

const locked = (field: string) => props.campaign.locks.includes(field)
const lockHint = (field: string) => (locked(field) ? 'Locked: this field cannot be changed' : undefined)

/** Only fields that differ from live state are sent. */
const changes = computed<Partial<CampaignFields>>(() => {
  const original = fromCampaign(props.campaign)
  const out: Partial<CampaignFields> = {}
  if (draft.name !== original.name) out.name = draft.name
  if (draft.status !== original.status) out.status = draft.status as CampaignFields['status']
  if (draft.dailyBudget !== original.dailyBudget && draft.dailyBudget !== '') {
    out.daily_budget = Math.round(Number(draft.dailyBudget) * 100)
  }
  return out
})

const dirty = computed(() => Object.keys(changes.value).length > 0)
const invalidBudget = computed(() => draft.dailyBudget !== '' && (Number.isNaN(Number(draft.dailyBudget)) || Number(draft.dailyBudget) < 0))

function onSubmit(): void {
  if (dirty.value && !invalidBudget.value) emit('submit', changes.value)
}
</script>

<template>
  <DsCard>
    <form class="ds-stack" @submit.prevent="onSubmit">
      <DsInput
        v-model="draft.name"
        label="Name"
        :disabled="locked('name')"
        :hint="lockHint('name')"
        :hint-icon="locked('name') ? Lock : undefined"
      />
      <DsSelect
        v-model="draft.status"
        label="Status"
        :options="STATUS_OPTIONS"
        :disabled="locked('status')"
        :hint="lockHint('status')"
        :hint-icon="locked('status') ? Lock : undefined"
      />
      <DsInput
        v-model="draft.dailyBudget"
        label="Daily budget (USD)"
        inputmode="decimal"
        :disabled="locked('daily_budget')"
        :hint="lockHint('daily_budget')"
        :hint-icon="locked('daily_budget') ? Lock : undefined"
        :error="invalidBudget ? 'Enter a valid amount.' : undefined"
      />
      <DsMessage v-if="errorMessage" tone="danger">{{ errorMessage }}</DsMessage>
      <div class="ds-row">
        <DsButton type="submit" :icon="Send" :loading="pending" :disabled="!dirty || invalidBudget">Submit for approval</DsButton>
      </div>
    </form>
  </DsCard>
</template>
