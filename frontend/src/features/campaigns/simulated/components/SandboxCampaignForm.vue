<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { FlaskConical, Save } from 'lucide-vue-next'
import { DsButton, DsCard, DsInput, DsMessage, DsSegmented, DsSelect } from '@/design-system'
import type { PlatformInfo, SandboxCampaignDetail, SandboxCampaignInput, SandboxCampaignUpdate, SandboxPlatform } from '@/shared/api/types'

const props = defineProps<{
  platforms: PlatformInfo[]
  pending?: boolean
  errorMessage?: string | null
  /** Platform to start on when creating (the tab the person came from). */
  platform?: SandboxPlatform
  /** Present when editing: the platform is fixed, a status can be set, and the button saves. */
  campaign?: SandboxCampaignDetail
}>()
const emit = defineEmits<{ submit: [input: SandboxCampaignInput]; save: [changes: SandboxCampaignUpdate] }>()

const editing = computed(() => props.campaign !== undefined)

const draft = reactive({
  platform: (props.campaign?.platform ?? props.platform ?? 'google') as SandboxPlatform,
  name: props.campaign?.name ?? '',
  goal: props.campaign?.goal ?? '',
  status: (props.campaign?.status === 'paused' ? 'paused' : 'active') as 'active' | 'paused',
  budget: props.campaign ? (props.campaign.daily_budget / 100).toFixed(2) : '150',
  vehicle: props.campaign?.inputs.vehicle ?? '',
  location: props.campaign?.inputs.location ?? '',
  landingUrl: props.campaign?.inputs.landing_url ?? '',
})
const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
]

const current = computed(() => props.platforms.find((p) => p.platform === draft.platform))
const platformOptions = computed(() => props.platforms.map((p) => ({ label: p.label, value: p.platform })))
const goalOptions = computed(() => (current.value?.goals ?? []).map((g) => ({ label: `${g.label} (${g.native})`, value: g.value })))

// Goals differ per platform: keep the chosen goal if the platform offers it, otherwise fall back to its first one.
watch(
  [() => draft.platform, goalOptions],
  () => {
    if (!goalOptions.value.some((o) => o.value === draft.goal)) draft.goal = goalOptions.value[0]?.value ?? ''
  },
  { immediate: true },
)

const budgetCents = computed(() => Math.round(Number(draft.budget) * 100))
const budgetError = computed(() =>
  draft.budget !== '' && (Number.isNaN(Number(draft.budget)) || budgetCents.value < 100 || budgetCents.value > 1_000_000)
    ? 'Enter an amount between $1 and $10,000.'
    : undefined,
)
const urlError = computed(() =>
  draft.landingUrl !== '' && !/^https?:\/\/\S+$/i.test(draft.landingUrl) ? 'Enter a full http or https address.' : undefined,
)
const valid = computed(
  () =>
    [draft.name, draft.vehicle, draft.location, draft.landingUrl, draft.budget, draft.goal].every((v) => v.trim() !== '') &&
    !budgetError.value &&
    !urlError.value,
)

function onSubmit(): void {
  if (!valid.value) return
  if (editing.value) {
    emit('save', {
      name: draft.name.trim(),
      goal: draft.goal,
      status: draft.status,
      daily_budget: budgetCents.value,
      vehicle: draft.vehicle.trim(),
      location: draft.location.trim(),
      landing_url: draft.landingUrl.trim(),
    })
    return
  }
  emit('submit', {
    platform: draft.platform,
    name: draft.name.trim(),
    goal: draft.goal,
    daily_budget: budgetCents.value,
    vehicle: draft.vehicle.trim(),
    location: draft.location.trim(),
    landing_url: draft.landingUrl.trim(),
  })
}
</script>

<template>
  <DsCard>
    <form class="ds-stack" @submit.prevent="onSubmit">
      <h2>{{ editing ? 'Campaign settings' : 'Create a simulated campaign' }}</h2>
      <p v-if="editing" class="ds-muted">
        {{ current?.label }} campaigns cannot change platform. Saving rebuilds the structure the platform would hold; the history of metrics
        is kept.
      </p>
      <DsSegmented v-else v-model="draft.platform" label="Platform" :options="platformOptions" />
      <DsInput v-model="draft.name" label="Campaign name" required />
      <DsSelect v-model="draft.goal" label="Goal (platform setting)" :options="goalOptions" />
      <DsSelect v-if="editing" v-model="draft.status" label="Status" :options="STATUS_OPTIONS" />
      <DsInput v-model="draft.budget" label="Daily budget (USD)" inputmode="decimal" required :error="budgetError" />
      <DsInput v-model="draft.vehicle" label="Vehicle model" placeholder="Camry" required />
      <DsInput v-model="draft.location" label="Target city" placeholder="Austin" required />
      <DsInput
        v-model="draft.landingUrl"
        label="Landing page"
        type="url"
        placeholder="https://dealer.example.com/camry"
        required
        :error="urlError"
      />
      <DsMessage v-if="errorMessage" tone="danger">{{ errorMessage }}</DsMessage>
      <div class="ds-row">
        <DsButton type="submit" :icon="editing ? Save : FlaskConical" :loading="pending" :disabled="!valid">{{
          editing ? 'Save changes' : 'Create in sandbox'
        }}</DsButton>
      </div>
    </form>
  </DsCard>
</template>
