<script setup lang="ts">
import { computed, useAttrs, useSlots, type Component } from 'vue'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
    icon?: Component
  }>(),
  { variant: 'primary', size: 'md', loading: false, disabled: false, type: 'button', icon: undefined },
)

const slots = useSlots()
const attrs = useAttrs()
const iconOnly = computed(() => !slots.default)

if (import.meta.env.DEV && iconOnly.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
  console.warn('[DsButton] An icon-only button needs an aria-label.')
}
</script>

<template>
  <button
    :type="type"
    class="ds-button"
    :class="[`ds-button--${variant}`, `ds-button--${size}`, { 'ds-button--icon-only': iconOnly }]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="ds-button__spinner" aria-hidden="true" />
    <component :is="icon" v-else-if="icon" class="ds-button__icon" aria-hidden="true" :size="18" />
    <span v-if="!iconOnly" class="ds-button__label"><slot /></span>
  </button>
</template>

<style scoped>
.ds-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  min-height: var(--ds-size-control-md);
  padding: 0 var(--ds-space-4);
  border: var(--ds-border-width-thin) solid transparent;
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--ds-duration-fast) var(--ds-easing-standard);
}
.ds-button--sm {
  min-height: var(--ds-size-control-sm);
  padding: 0 var(--ds-space-3);
}
.ds-button--lg {
  min-height: var(--ds-size-control-lg);
  padding: 0 var(--ds-space-6);
  font-size: var(--ds-font-size-md);
}
.ds-button--icon-only {
  width: var(--ds-size-control-md);
  padding: 0;
}
.ds-button--icon-only.ds-button--sm {
  width: var(--ds-size-control-sm);
}
.ds-button--icon-only.ds-button--lg {
  width: var(--ds-size-control-lg);
}
.ds-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.ds-button--primary {
  background: var(--ds-color-action-primary-bg);
  color: var(--ds-color-action-primary-text);
}
.ds-button--primary:hover:not(:disabled) {
  background: var(--ds-color-action-primary-bg-hover);
}
.ds-button--primary:active:not(:disabled) {
  background: var(--ds-color-action-primary-bg-active);
}

.ds-button--secondary {
  background: var(--ds-color-action-secondary-bg);
  color: var(--ds-color-action-secondary-text);
  border-color: var(--ds-color-action-secondary-border);
}
.ds-button--secondary:hover:not(:disabled) {
  background: var(--ds-color-action-secondary-bg-hover);
}
.ds-button--secondary:active:not(:disabled) {
  background: var(--ds-color-action-secondary-bg-active);
}

.ds-button--danger {
  background: var(--ds-color-action-danger-bg);
  color: var(--ds-color-action-danger-text);
}
.ds-button--danger:hover:not(:disabled) {
  background: var(--ds-color-action-danger-bg-hover);
}
.ds-button--danger:active:not(:disabled) {
  background: var(--ds-color-action-danger-bg-active);
}

.ds-button--ghost {
  background: transparent;
  color: var(--ds-color-action-ghost-text);
}
.ds-button--ghost:hover:not(:disabled) {
  background: var(--ds-color-action-ghost-bg-hover);
}
.ds-button--ghost:active:not(:disabled) {
  background: var(--ds-color-action-ghost-bg-active);
}

.ds-button__spinner {
  width: var(--ds-size-icon-sm);
  height: var(--ds-size-icon-sm);
  border: var(--ds-border-width-thick) solid currentcolor;
  border-top-color: transparent;
  border-radius: var(--ds-radius-full);
  animation: ds-spin 0.7s linear infinite;
}
@keyframes ds-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
