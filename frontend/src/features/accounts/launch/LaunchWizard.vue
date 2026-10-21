<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { RotateCw } from 'lucide-vue-next'
import { DsButton, DsCard, DsInput, DsMessage, DsSegmented, DsSelect, DsTable, DsTag, type DsColumn, type DsOption } from '@/design-system'
import type { Account, LaunchOem, LaunchPlan, LaunchSettings } from '@/shared/api/types'
import { formatMoney } from '@/shared/utils/format'
import { parseDollarsToCents } from '@/shared/utils/parseMoney'
import { defaultSettings, MIN_CAP } from './defaults'

const STEPS = [
  { id: 'playbook', label: 'Playbook' },
  { id: 'settings', label: 'Settings' },
  { id: 'review', label: 'Review and deploy' },
] as const
type Step = (typeof STEPS)[number]['id']

const props = defineProps<{
  status: 'loading' | 'error' | 'ready'
  step: Step
  plan: LaunchPlan | null
  /** The one account this launch is for: its own monthly budget is the default cap. */
  account: Account
  error?: string | null
}>()
const emit = defineEmits<{ next: []; previous: []; reload: [] }>()
const oem = defineModel<LaunchOem>('oem', { required: true })
const campaignIds = defineModel<number[]>('campaignIds', { required: true })
const settings = defineModel<LaunchSettings>('settings', { required: true })

defineSlots<{ review?: () => unknown }>()

const CAMPAIGN_COLUMNS: DsColumn[] = [
  { key: 'pick', label: 'Launch' },
  { key: 'name', label: 'Campaign' },
  { key: 'share', label: 'Share of the monthly cap', align: 'end' },
]
const PACING: DsOption[] = [
  { label: 'Even: spread the monthly budget evenly (default)', value: 'even' },
  { label: 'Front-loaded: spend earlier in the month', value: 'front_loaded' },
]
const WRITE_STATUS: DsOption[] = [
  { label: 'Paused at write (recommended)', value: 'paused' },
  { label: 'Enabled at write', value: 'enabled' },
]

const oemOptions = computed(() => (props.plan?.oems ?? []).map((o) => ({ label: o.label, value: o.id })))
const selectedOem = computed(() => props.plan?.oems.find((o) => o.id === oem.value))
const campaigns = computed(() => props.plan?.campaigns ?? [])
const allSelected = computed(() => campaigns.value.length > 0 && campaignIds.value.length === campaigns.value.length)

function toggle(id: number, on: boolean): void {
  campaignIds.value = on ? [...campaignIds.value, id] : campaignIds.value.filter((x) => x !== id)
}
const toggleAll = (on: boolean): void => void (campaignIds.value = on ? campaigns.value.map((c) => c.id) : [])

// Settings are shown as inherited values; the fields appear only when the person asks to change them for this launch.
const editing = ref(false)
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
function useDefaults(): void {
  const defaults = defaultSettings(props.account)
  settings.value = defaults
  capText.value = (defaults.monthly_cap / 100).toFixed(2)
  capError.value = null
  editing.value = false
}
const pacingLabel = computed(() => PACING.find((o) => o.value === settings.value.pacing)?.label.split(':')[0])
const writeLabel = computed(() => WRITE_STATUS.find((o) => o.value === settings.value.status_at_write)?.label)

const canContinue = computed(() =>
  props.step === 'playbook' ? campaignIds.value.length > 0 : props.step === 'settings' ? capError.value === null : false,
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
  <p v-if="status === 'loading'" class="ds-muted" role="status">Loading the playbook…</p>

  <DsMessage v-else-if="status === 'error'" tone="danger">
    <p>{{ error ?? 'The playbook could not be loaded.' }}</p>
    <DsButton variant="secondary" size="sm" :icon="RotateCw" @click="emit('reload')">Try again</DsButton>
  </DsMessage>

  <div v-else class="ds-stack">
    <ol class="steps" aria-label="Launch steps">
      <li
        v-for="(s, i) in STEPS"
        :key="s.id"
        :aria-current="s.id === step ? 'step' : undefined"
        :class="{ 'steps__item--current': s.id === step }"
      >
        {{ i + 1 }}. {{ s.label }}
      </li>
    </ol>

    <h2 ref="heading" tabindex="-1" class="title">{{ STEPS[stepIndex].label }}</h2>

    <template v-if="step === 'playbook'">
      <DsCard>
        <DsSegmented v-model="oem" label="Brand program (OEM rulebook)" :options="oemOptions" />
        <p v-if="selectedOem?.rules" class="ds-muted note">
          <DsTag tone="info">{{ selectedOem.rules }} rules encoded</DsTag>
          This OEM's rulebook is rendered into the playbook at launch, so compliance checks run automatically. Source:
          {{ selectedOem.source }}.
        </p>
        <p v-else class="ds-muted note">Launch the base playbook with no OEM rulebook applied.</p>
      </DsCard>

      <DsCard :padded="false">
        <DsTable
          :columns="CAMPAIGN_COLUMNS"
          :rows="campaigns"
          row-key="id"
          :caption="`Campaigns the ${plan?.playbook.name} playbook launches`"
        >
          <template #cell-pick="{ row }">
            <input
              type="checkbox"
              :aria-label="`Launch ${row.name}`"
              :checked="campaignIds.includes(row.id)"
              :aria-describedby="countId"
              @change="toggle(row.id, ($event.target as HTMLInputElement).checked)"
            />
          </template>
          <template #cell-share="{ row }">{{ Math.round(row.share * 100) }}%</template>
        </DsTable>
      </DsCard>
      <div class="ds-row">
        <label class="all" :for="allId"
          ><input :id="allId" type="checkbox" :checked="allSelected" @change="toggleAll(($event.target as HTMLInputElement).checked)" />
          Launch all campaigns</label
        >
        <p :id="countId" class="ds-muted" role="status">{{ campaignIds.length }} of {{ campaigns.length }} campaigns selected</p>
      </div>
    </template>

    <DsCard v-else-if="step === 'settings'" class="ds-stack">
      <DsMessage v-if="account.monthly_budget === null" tone="warning">
        {{ account.dealer_name }} has no budget in Salesforce yet. You can still preview: its campaigns will be held until one exists.
      </DsMessage>
      <template v-if="!editing">
        <p class="ds-muted">These come from the account and the playbook. Change them only if this launch needs something different.</p>
        <dl class="facts">
          <div>
            <dt>Monthly cap</dt>
            <dd>
              {{ formatMoney(settings.monthly_cap) }}
              <span class="ds-muted">{{
                account.monthly_budget === null ? '(no account budget)' : "(this account's monthly budget)"
              }}</span>
            </dd>
          </div>
          <div>
            <dt>Pacing</dt>
            <dd>{{ pacingLabel }} <span class="ds-muted">(inherited from the playbook)</span></dd>
          </div>
          <div>
            <dt>Status at write</dt>
            <dd>{{ writeLabel }}</dd>
          </div>
        </dl>
        <div><DsButton variant="secondary" @click="editing = true">Change for this launch</DsButton></div>
      </template>
      <template v-else>
        <DsInput
          :model-value="capText"
          label="Monthly budget cap (USD)"
          inputmode="decimal"
          autocomplete="off"
          hint="A cap above this account's own monthly budget holds the campaigns."
          :error="capError ?? undefined"
          @update:model-value="onCap"
        />
        <DsSelect
          :model-value="settings.pacing"
          label="Pacing policy"
          :options="PACING"
          @update:model-value="settings = { ...settings, pacing: $event as LaunchSettings['pacing'] }"
        />
        <DsSelect
          :model-value="settings.status_at_write"
          label="Status at write"
          :options="WRITE_STATUS"
          @update:model-value="settings = { ...settings, status_at_write: $event as LaunchSettings['status_at_write'] }"
        />
        <div><DsButton variant="secondary" @click="useDefaults">Use the account defaults</DsButton></div>
      </template>
    </DsCard>

    <template v-else>
      <DsMessage tone="info"
        >Preview only: nothing is written until you approve. Every write goes through the governed path and leaves a receipt.</DsMessage
      >
      <slot name="review" />
    </template>

    <div class="ds-row nav">
      <DsButton v-if="step !== 'playbook'" variant="secondary" @click="emit('previous')">Previous step</DsButton>
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
.note {
  margin-top: var(--ds-space-3);
}
.all {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
}
.facts {
  display: grid;
  gap: var(--ds-space-3);
  margin: 0;
}
.facts dt {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
}
.facts dd {
  margin: 0;
  font-weight: var(--ds-font-weight-semibold);
}
</style>
