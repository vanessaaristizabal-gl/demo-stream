<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { RotateCw } from 'lucide-vue-next'
import { DsButton, DsCard, DsInput, DsMessage, DsSegmented, DsSelect, DsTag, DsTable, type DsColumn } from '@/design-system'
import type { LabDeployOptions, LabDeploySettings, LabOem, LabReceipt } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import { formatMoney } from '@/shared/utils/format'
import { parseDollarsToCents } from '../budget'

const STEPS = [
  { id: 'accounts', label: 'Accounts' },
  { id: 'settings', label: 'Settings' },
  { id: 'review', label: 'Review and deploy' },
] as const
type Step = (typeof STEPS)[number]['id']

const MIN_CAP = 10_000

const props = defineProps<{
  status: 'loading' | 'error' | 'ready'
  step: Step
  options: LabDeployOptions | null
  error?: string | null
  receipts: LabReceipt[]
}>()
const emit = defineEmits<{ next: []; previous: []; reload: [] }>()
const oem = defineModel<LabOem>('oem', { required: true })
const accountIds = defineModel<number[]>('accountIds', { required: true })
const settings = defineModel<LabDeploySettings>('settings', { required: true })

defineSlots<{ review?: () => unknown }>()

const ACCOUNT_COLUMNS: DsColumn[] = [
  { key: 'pick', label: 'Select' },
  { key: 'name', label: 'Account' },
  { key: 'oem', label: 'OEM' },
  { key: 'budget_group', label: 'Salesforce budget' },
]
const RECEIPT_COLUMNS: DsColumn[] = [
  { key: 'account', label: 'Account' },
  { key: 'actor', label: 'Who' },
  { key: 'summary', label: 'What' },
  { key: 'steps', label: 'Path' },
  { key: 'at', label: 'When' },
]
const PACING = [
  { label: 'Even: spread the monthly budget evenly (default)', value: 'even' },
  { label: 'Front-loaded: spend earlier in the month', value: 'front_loaded' },
]
const WRITE_STATUS = [
  { label: 'Paused at write (recommended)', value: 'paused' },
  { label: 'Enabled at write', value: 'enabled' },
]

const oemOptions = computed(() => (props.options?.oems ?? []).map((o) => ({ label: o.label, value: o.id })))
const selectedOem = computed(() => props.options?.oems.find((o) => o.id === oem.value))
const accounts = computed(() => props.options?.accounts ?? [])
const allSelected = computed(() => accounts.value.length > 0 && accountIds.value.length === accounts.value.length)

function toggle(id: number, on: boolean): void {
  accountIds.value = on ? [...accountIds.value, id] : accountIds.value.filter((x) => x !== id)
}
function toggleAll(on: boolean): void {
  accountIds.value = on ? accounts.value.map((a) => a.id) : []
}

const capText = ref((settings.value.monthly_cap / 100).toFixed(2))
const capError = ref<string | null>(null)
function onCap(text: string): void {
  capText.value = text
  const cents = parseDollarsToCents(text)
  if (cents === null || cents < MIN_CAP) {
    capError.value = 'Enter a monthly cap of at least $100.00 with at most two decimals.'
    return
  }
  capError.value = null
  settings.value = { ...settings.value, monthly_cap: cents }
}

const canContinue = computed(() =>
  props.step === 'accounts' ? accountIds.value.length > 0 : props.step === 'settings' ? capError.value === null : false,
)
const stepIndex = computed(() => STEPS.findIndex((s) => s.id === props.step))

// A step change replaces the controls that had focus: land on the new step's heading (WCAG 2.4.3).
const heading = ref<HTMLElement | null>(null)
watch(
  () => props.step,
  async () => {
    await nextTick()
    heading.value?.focus()
  },
)
const countId = useId()
const allId = useId()
</script>

<template>
  <p v-if="status === 'loading'" class="ds-muted" role="status">Loading the deploy options…</p>

  <DsMessage v-else-if="status === 'error'" tone="danger">
    <p>{{ error ?? 'The deploy options could not be loaded.' }}</p>
    <DsButton variant="secondary" size="sm" :icon="RotateCw" @click="emit('reload')">Try again</DsButton>
  </DsMessage>

  <div v-else class="ds-stack">
    <ol class="steps" aria-label="Deploy steps">
      <li
        v-for="(s, i) in STEPS"
        :key="s.id"
        :aria-current="s.id === step ? 'step' : undefined"
        :class="{ 'steps__item--current': s.id === step, 'steps__item--done': i < stepIndex }"
      >
        {{ i + 1 }}. {{ s.label }}
      </li>
    </ol>

    <h2 ref="heading" tabindex="-1" class="title">{{ STEPS[stepIndex].label }}</h2>

    <template v-if="step === 'accounts'">
      <DsCard>
        <DsSegmented v-model="oem" label="Brand program (OEM rulebook)" :options="oemOptions" />
        <p v-if="selectedOem?.rules" class="ds-muted note">
          <DsTag tone="info">{{ selectedOem.rules }} rules encoded</DsTag>
          This OEM's rulebook is rendered into the playbook at deploy, so compliance checks run automatically. Source:
          {{ selectedOem.source }}.
        </p>
        <p v-else class="ds-muted note">Deploy the base playbook with no OEM rulebook applied.</p>
      </DsCard>

      <DsCard :padded="false">
        <DsTable :columns="ACCOUNT_COLUMNS" :rows="accounts" row-key="id" caption="Accounts to deploy to">
          <template #cell-pick="{ row }">
            <input
              type="checkbox"
              :aria-label="`Select ${row.name}`"
              :checked="accountIds.includes(row.id)"
              :aria-describedby="countId"
              @change="toggle(row.id, ($event.target as HTMLInputElement).checked)"
            />
          </template>
          <template #cell-oem="{ row }">{{ row.oem === 'stellantis' ? 'Stellantis' : 'Toyota' }}</template>
          <template #cell-budget_group="{ row }">
            <DsTag v-if="row.budget_group === 'active'" tone="success">Active, up to {{ formatMoney(row.envelope) }}</DsTag>
            <DsTag v-else tone="warning">None: will hold</DsTag>
          </template>
        </DsTable>
      </DsCard>
      <div class="ds-row">
        <label class="all" :for="allId"
          ><input :id="allId" type="checkbox" :checked="allSelected" @change="toggleAll(($event.target as HTMLInputElement).checked)" />
          Select all accounts</label
        >
        <p :id="countId" class="ds-muted" role="status">{{ accountIds.length }} of {{ accounts.length }} accounts selected</p>
      </div>
    </template>

    <DsCard v-else-if="step === 'settings'" class="ds-stack">
      <DsInput
        :model-value="capText"
        label="Monthly budget cap (USD)"
        inputmode="decimal"
        autocomplete="off"
        hint="Budget amounts come from Salesforce. A cap above an account's approved envelope holds that account."
        :error="capError ?? undefined"
        @update:model-value="onCap"
      />
      <DsSelect
        :model-value="settings.pacing"
        label="Pacing policy"
        :options="PACING"
        @update:model-value="settings = { ...settings, pacing: $event as LabDeploySettings['pacing'] }"
      />
      <DsSelect
        :model-value="settings.status_at_write"
        label="Status at write"
        :options="WRITE_STATUS"
        @update:model-value="settings = { ...settings, status_at_write: $event as LabDeploySettings['status_at_write'] }"
      />
    </DsCard>

    <template v-else>
      <DsMessage tone="info"
        >Preview only: nothing is written until you approve. Every write goes through the governed path and leaves a receipt.</DsMessage
      >
      <slot name="review" />
      <section v-if="receipts.length > 0" aria-labelledby="receipts-title">
        <h3 id="receipts-title" class="subtitle">Changelog receipts ({{ receipts.length }})</h3>
        <DsCard :padded="false">
          <DsTable :columns="RECEIPT_COLUMNS" :rows="receipts" row-key="id" caption="Receipts for this deploy">
            <template #cell-steps="{ row }">{{ row.steps.join(' > ') }}</template>
            <template #cell-at="{ row }"><DateText :value="row.at" /></template>
          </DsTable>
        </DsCard>
      </section>
    </template>

    <div class="ds-row nav">
      <DsButton v-if="step !== 'accounts'" variant="secondary" @click="emit('previous')">Previous step</DsButton>
      <DsButton v-if="step !== 'review'" :disabled="!canContinue" @click="emit('next')">{{
        step === 'settings' ? 'Build the preview' : 'Continue to settings'
      }}</DsButton>
    </div>
  </div>
</template>

<style scoped>
.steps {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-4);
  padding: 0;
  list-style: none;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
}
.steps__item--current {
  color: var(--ds-color-text-default);
  font-weight: var(--ds-font-weight-semibold);
}
.title {
  font-size: var(--ds-font-size-xl);
}
.subtitle {
  margin-bottom: var(--ds-space-2);
  font-size: var(--ds-font-size-lg);
}
.note {
  margin-top: var(--ds-space-3);
}
.all {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
}
</style>
