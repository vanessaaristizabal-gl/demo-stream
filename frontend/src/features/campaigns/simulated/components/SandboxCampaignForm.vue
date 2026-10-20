<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { FlaskConical } from 'lucide-vue-next'
import { DsButton, DsCard, DsInput, DsMessage, DsSegmented, DsSelect } from '@/design-system'
import type { PlatformInfo, SandboxCampaignInput, SandboxPlatform } from '@/shared/api/types'

const props = defineProps<{ platforms: PlatformInfo[]; pending?: boolean; errorMessage?: string | null }>()
const emit = defineEmits<{ submit: [input: SandboxCampaignInput] }>()

const draft = reactive({
  platform: 'google' as SandboxPlatform,
  name: '',
  goal: '',
  budget: '150',
  vehicle: '',
  location: '',
  landingUrl: '',
})

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
      <h2>Create a simulated campaign</h2>
      <DsSegmented v-model="draft.platform" label="Platform" :options="platformOptions" />
      <DsInput v-model="draft.name" label="Campaign name" required />
      <DsSelect v-model="draft.goal" label="Goal (platform setting)" :options="goalOptions" />
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
        <DsButton type="submit" :icon="FlaskConical" :loading="pending" :disabled="!valid">Create in sandbox</DsButton>
      </div>
    </form>
  </DsCard>
</template>
