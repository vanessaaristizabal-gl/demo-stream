<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import type { DsOption } from './DsSelect.vue'

defineProps<{ label: string; options: DsOption[] }>()
const model = defineModel<string>({ required: true })
// Reka RadioGroup: roving tabindex and arrow keys, announced as a radio group.
</script>

<template>
  <RadioGroupRoot v-model="model" class="ds-segmented" :aria-label="label" orientation="horizontal">
    <RadioGroupItem v-for="o in options" :key="o.value" :value="o.value" class="ds-segmented__item">
      <Check v-if="model === o.value" aria-hidden="true" :size="14" />
      {{ o.label }}
    </RadioGroupItem>
  </RadioGroupRoot>
</template>

<style scoped>
.ds-segmented {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
  padding: var(--ds-space-1);
  background: var(--ds-color-bg-subtle);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
}
.ds-segmented__item {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  min-height: var(--ds-size-control-sm);
  padding: 0 var(--ds-space-3);
  background: transparent;
  color: var(--ds-color-text-default);
  border: 0;
  border-radius: var(--ds-radius-sm);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  cursor: pointer;
}
.ds-segmented__item:hover {
  background: var(--ds-color-bg-hover);
}
.ds-segmented__item[data-state='checked'] {
  font-weight: var(--ds-font-weight-semibold);
  background: var(--ds-color-action-primary-bg);
  color: var(--ds-color-action-primary-text);
}
</style>
