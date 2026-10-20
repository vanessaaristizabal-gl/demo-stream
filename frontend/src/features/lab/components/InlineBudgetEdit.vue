<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId } from 'vue'
import { Check, X } from 'lucide-vue-next'
import { DsButton } from '@/design-system'
import { formatMoney } from '@/shared/utils/format'
import { parseDollarsToCents } from '../budget'

const props = defineProps<{ name: string; cents: number; saving: boolean }>()
const emit = defineEmits<{ save: [cents: number]; cancel: [] }>()

const text = ref((props.cents / 100).toFixed(2))
const invalid = ref<string | null>(null)
const input = ref<HTMLInputElement | null>(null)
const errorId = useId()
const label = computed(() => `Daily budget in dollars for ${props.name}`)

onMounted(async () => {
  await nextTick()
  input.value?.select()
})

// Escape cancels from any control of the editor, but never while a save is in flight.
function onEscape(): void {
  if (!props.saving) emit('cancel')
}

defineExpose({ focus: () => input.value?.focus() })

function submit(): void {
  const cents = parseDollarsToCents(text.value)
  if (cents === null) {
    invalid.value = 'Enter an amount of at least $1.00 with at most two decimals.'
    return
  }
  invalid.value = null
  emit('save', cents)
}
</script>

<template>
  <form class="edit" novalidate @submit.prevent="submit">
    <input
      ref="input"
      v-model="text"
      class="edit__input"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      :aria-label="label"
      :aria-invalid="invalid ? true : undefined"
      :aria-describedby="invalid ? errorId : undefined"
      :disabled="saving"
      @keydown.esc.prevent="onEscape"
    />
    <DsButton
      type="submit"
      size="sm"
      :icon="Check"
      :loading="saving"
      :aria-label="`Save budget for ${name}`"
      @keydown.esc.prevent="onEscape"
    />
    <DsButton
      size="sm"
      variant="secondary"
      :icon="X"
      :disabled="saving"
      :aria-label="`Cancel editing ${name}`"
      @click="emit('cancel')"
      @keydown.esc.prevent="onEscape"
    />
    <p v-if="invalid" :id="errorId" class="edit__error" role="alert">{{ invalid }}</p>
    <span class="ds-sr-only">Current budget {{ formatMoney(cents) }}</span>
  </form>
</template>

<style scoped>
.edit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
}
.edit__input {
  width: 7rem;
  min-height: var(--ds-size-target-min);
  padding: 0 var(--ds-space-2);
  background: var(--ds-color-bg-surface);
  color: var(--ds-color-text-default);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-strong);
  border-radius: var(--ds-radius-md);
  text-align: end;
}
.edit__input[aria-invalid='true'] {
  border-color: var(--ds-color-tone-danger-text);
  border-width: var(--ds-border-width-thick);
}
.edit__error {
  flex-basis: 100%;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-tone-danger-text);
  white-space: normal;
}
</style>
