<script setup lang="ts">
import { computed, useId, type Component } from 'vue'
import { CircleAlert } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    label: string
    type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'
    hint?: string
    hintIcon?: Component
    error?: string
    disabled?: boolean
    required?: boolean
    readonly?: boolean
    autocomplete?: string
    inputmode?: 'text' | 'decimal' | 'numeric' | 'email' | 'search'
    placeholder?: string
  }>(),
  {
    type: 'text',
    hint: undefined,
    hintIcon: undefined,
    error: undefined,
    autocomplete: undefined,
    inputmode: undefined,
    placeholder: undefined,
  },
)

const model = defineModel<string>({ default: '' })

const uid = useId()
const hintId = `${uid}-hint`
const errorId = `${uid}-error`
const describedBy = computed(() => [props.hint ? hintId : null, props.error ? errorId : null].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div class="ds-field">
    <label :for="uid" class="ds-field__label">
      {{ label }}
      <span v-if="required" class="ds-field__required" aria-hidden="true">*</span>
    </label>
    <div class="ds-field__control">
      <input
        :id="uid"
        v-model="model"
        class="ds-input"
        :class="{ 'ds-input--invalid': error, 'ds-input--suffix': $slots.suffix }"
        :type="type"
        :disabled="disabled"
        :required="required"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
      />
      <div v-if="$slots.suffix" class="ds-field__suffix"><slot name="suffix" /></div>
    </div>
    <p v-if="hint" :id="hintId" class="ds-field__hint">
      <component :is="hintIcon" v-if="hintIcon" aria-hidden="true" :size="14" />
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="ds-field__error" role="alert">
      <CircleAlert aria-hidden="true" :size="14" />
      {{ error }}
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
.ds-field__required {
  margin-left: var(--ds-space-1);
}
.ds-field__control {
  position: relative;
}
.ds-input {
  width: 100%;
  min-height: var(--ds-size-control-md);
  padding: 0 var(--ds-space-3);
  background: var(--ds-color-bg-surface);
  color: var(--ds-color-text-default);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-strong);
  border-radius: var(--ds-radius-md);
}
.ds-input::placeholder {
  color: var(--ds-color-text-muted);
}
.ds-input--suffix {
  padding-right: var(--ds-size-control-md);
}
.ds-input--invalid {
  border-color: var(--ds-color-tone-danger-text);
  border-width: var(--ds-border-width-thick);
}
.ds-input:disabled {
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-disabled);
  cursor: not-allowed;
}
.ds-field__suffix {
  position: absolute;
  top: 50%;
  right: var(--ds-space-1);
  transform: translateY(-50%);
}
.ds-field__hint,
.ds-field__error {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
}
.ds-field__hint {
  color: var(--ds-color-text-muted);
}
.ds-field__error {
  color: var(--ds-color-tone-danger-text);
  font-weight: var(--ds-font-weight-medium);
}
</style>
