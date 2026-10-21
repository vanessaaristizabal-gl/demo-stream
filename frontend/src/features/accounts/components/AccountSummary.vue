<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { ClipboardCheck, RotateCw } from 'lucide-vue-next'
import { DsButton, DsCard, DsMessage, DsTag } from '@/design-system'
import { formatMoney } from '@/shared/utils/format'

type Pace = 'on-pace' | 'underpacing' | 'overspending'

const props = withDefaults(
  defineProps<{
    status: 'loading' | 'error' | 'ready'
    /** Why the account could not be loaded (status error). */
    error?: string | null
    name: string
    pace: Pace
    oem: string
    tier: string
    strategist: string
    /** Internal account code, for example ADV-SCHCDJR. */
    accountCode: string
    googleAdsCustomerId: string
    /** All money is integer cents. */
    allocatedBudget: number
    spendToday: number
    monthToDateSpend: number
    /** Allocated budget minus month-to-date spend, calculated by the server and shown unchanged. */
    availableSpend: number
    /** An audit is running. */
    auditing?: boolean
  }>(),
  { error: null, auditing: false },
)
const emit = defineEmits<{ reload: []; audit: [] }>()

const PACE: Record<Pace, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  'on-pace': { label: 'On pace', tone: 'success' },
  underpacing: { label: 'Underpacing', tone: 'warning' },
  overspending: { label: 'Overspending', tone: 'danger' },
}
const paceInfo = computed(() => PACE[props.pace])

// A budget of zero has no bar: dividing by it would give Infinity or NaN.
const hasBudget = computed(() => props.allocatedBudget > 0)
// Spend at or above the allocation fills the bar and stops there; rounding never says "full" while there is still budget left.
const percent = computed(() => {
  if (!hasBudget.value) return 0
  if (props.monthToDateSpend >= props.allocatedBudget) return 100
  return Math.min(99, Math.round((props.monthToDateSpend / props.allocatedBudget) * 100))
})
const overBy = computed(() => (hasBudget.value ? Math.max(0, props.monthToDateSpend - props.allocatedBudget) : 0))
const barLabel = computed(() => `Month-to-date spend of ${props.name}`)
const barText = computed(() => `${formatMoney(props.monthToDateSpend)} of ${formatMoney(props.allocatedBudget)} spent`)

// The control that has focus disappears (Try again) or is disabled (Run audit): hand focus to something sensible.
const loadingMessage = ref<HTMLElement | null>(null)
const errorBox = ref<HTMLElement | null>(null)
const auditButton = ref<InstanceType<typeof DsButton> | null>(null)
const headingId = useId()
watch(
  () => props.status,
  async (now, before) => {
    if (before === 'error' && now === 'loading') {
      await nextTick()
      loadingMessage.value?.focus()
    }
    // A retry that fails removes the loading message that had focus: the error is where the person must land.
    if (before === 'loading' && now === 'error') {
      await nextTick()
      errorBox.value?.focus()
    }
  },
)
watch(
  () => props.auditing,
  async (now, before) => {
    if (before && !now) {
      await nextTick()
      ;(auditButton.value?.$el as HTMLElement | undefined)?.focus()
    }
  },
)
</script>

<template>
  <p v-if="status === 'loading'" ref="loadingMessage" class="ds-muted" role="status" tabindex="-1">Loading the account…</p>

  <div v-else-if="status === 'error'" ref="errorBox" tabindex="-1">
    <DsMessage tone="danger">
      <p>{{ error ?? 'The account could not be loaded.' }}</p>
      <DsButton variant="secondary" size="sm" :icon="RotateCw" @click="emit('reload')">Try again</DsButton>
    </DsMessage>
  </div>

  <DsCard v-else as="section" :aria-labelledby="headingId">
    <div class="summary">
      <div class="identity">
        <h1 :id="headingId" class="name">{{ name }}</h1>
        <DsTag :tone="paceInfo.tone">{{ paceInfo.label }}</DsTag>
      </div>
      <DsButton ref="auditButton" variant="secondary" size="sm" :icon="ClipboardCheck" :loading="auditing" @click="emit('audit')">
        Run audit
      </DsButton>
    </div>

    <dl class="facts">
      <div>
        <dt>OEM</dt>
        <dd>{{ oem }}</dd>
      </div>
      <div>
        <dt>Tier</dt>
        <dd>{{ tier }}</dd>
      </div>
      <div>
        <dt>Strategist</dt>
        <dd>{{ strategist }}</dd>
      </div>
      <div>
        <dt>Account code</dt>
        <dd>{{ accountCode }}</dd>
      </div>
      <div>
        <dt>Google Ads customer id</dt>
        <dd>{{ googleAdsCustomerId }}</dd>
      </div>
    </dl>

    <dl class="money">
      <div>
        <dt>Allocated budget</dt>
        <dd>{{ formatMoney(allocatedBudget) }}<span class="per"> / month</span></dd>
      </div>
      <div>
        <dt>Spend today</dt>
        <dd>{{ formatMoney(spendToday) }}</dd>
      </div>
      <div>
        <dt>Available spend</dt>
        <dd>{{ formatMoney(availableSpend) }}</dd>
      </div>
    </dl>

    <p v-if="!hasBudget" class="ds-muted">No budget allocated</p>
    <div v-else class="pacing">
      <div
        class="track"
        role="progressbar"
        :aria-label="barLabel"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="percent"
        :aria-valuetext="barText"
      >
        <div class="fill" :class="`fill--${paceInfo.tone}`" :style="{ width: `${percent}%` }" />
      </div>
      <p class="ds-muted">
        {{ barText }}<template v-if="overBy > 0"> · {{ formatMoney(overBy) }} over</template>
      </p>
    </div>
  </DsCard>
</template>

<style scoped>
.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-3);
}
.identity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
}
.name {
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-bold);
}
.facts,
.money {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3) var(--ds-space-6);
  margin-top: var(--ds-space-4);
}
.money {
  padding-top: var(--ds-space-4);
  border-top: var(--ds-border-width-thin) solid var(--ds-color-border-default);
}
dt {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
}
.facts dd {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  overflow-wrap: anywhere;
}
.money dd {
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-semibold);
}
.per {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-regular);
  color: var(--ds-color-text-muted);
}
.pacing {
  display: grid;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-4);
}
.track {
  height: var(--ds-space-3);
  overflow: hidden;
  background: var(--ds-color-bg-subtle);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-full);
}
.fill {
  height: 100%;
}
.fill--success {
  background: var(--ds-color-tone-success-text);
}
.fill--warning {
  background: var(--ds-color-tone-warning-text);
}
.fill--danger {
  background: var(--ds-color-tone-danger-text);
}
</style>
