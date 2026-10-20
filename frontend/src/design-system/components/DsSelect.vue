<script setup lang="ts">
import { computed, useId, type Component } from 'vue'
import { ChevronsUpDown } from 'lucide-vue-next'

export interface DsOption {
  label: string
  value: string
}

const props = withDefaults(defineProps<{ label: string; options: DsOption[]; hint?: string; hintIcon?: Component; disabled?: boolean }>(), {
  hint: undefined,
  hintIcon: undefined,
})

const model = defineModel<string>({ required: true })
const uid = useId()
const hintId = `${uid}-hint`
const describedBy = computed(() => (props.hint ? hintId : undefined))
// Native <select>: best keyboard, screen-reader and mobile behaviour for free.
</script>

<template>
  <div class="ds-field">
    <label :for="uid" class="ds-field__label">{{ label }}</label>
    <div class="ds-select-wrap">
      <select :id="uid" v-model="model" class="ds-select" :disabled="disabled" :aria-describedby="describedBy">
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <ChevronsUpDown class="ds-select__chevron" aria-hidden="true" :size="16" />
    </div>
    <p v-if="hint" :id="hintId" class="ds-field__hint">
      <component :is="hintIcon" v-if="hintIcon" aria-hidden="true" :size="14" />
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.ds-field {
  display: grid;
  gap: var(--ds-space-1);
}
.ds-field__label {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
}
.ds-select-wrap {
  position: relative;
}
.ds-select {
  appearance: none;
  width: 100%;
  min-height: var(--ds-size-control-md);
  padding: 0 var(--ds-size-control-md) 0 var(--ds-space-3);
  background: var(--ds-color-bg-surface);
  color: var(--ds-color-text-default);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-strong);
  border-radius: var(--ds-radius-md);
}
.ds-select:disabled {
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-disabled);
  cursor: not-allowed;
}
.ds-select__chevron {
  position: absolute;
  top: 50%;
  right: var(--ds-space-3);
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--ds-color-text-muted);
}
.ds-field__hint {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
}
</style>
