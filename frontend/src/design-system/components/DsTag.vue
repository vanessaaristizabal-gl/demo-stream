<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }>(), { tone: 'neutral' })
</script>

<template>
  <span class="ds-tag" :class="`ds-tag--${tone}`"><slot /></span>
</template>

<style scoped>
.ds-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--ds-space-1) var(--ds-space-3);
  border: var(--ds-border-width-thin) solid transparent;
  border-radius: var(--ds-radius-full);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-font-line-height-tight);
  letter-spacing: var(--ds-font-letter-spacing-wide);
  text-transform: capitalize;
  white-space: nowrap;
}
.ds-tag--neutral {
  background: var(--ds-color-tone-neutral-bg);
  color: var(--ds-color-tone-neutral-text);
  border-color: var(--ds-color-tone-neutral-border);
}
.ds-tag--info {
  background: var(--ds-color-tone-info-bg);
  color: var(--ds-color-tone-info-text);
  border-color: var(--ds-color-tone-info-border);
}
.ds-tag--success {
  background: var(--ds-color-tone-success-bg);
  color: var(--ds-color-tone-success-text);
  border-color: var(--ds-color-tone-success-border);
}
.ds-tag--warning {
  background: var(--ds-color-tone-warning-bg);
  color: var(--ds-color-tone-warning-text);
  border-color: var(--ds-color-tone-warning-border);
}
.ds-tag--danger {
  background: var(--ds-color-tone-danger-bg);
  color: var(--ds-color-tone-danger-text);
  border-color: var(--ds-color-tone-danger-border);
}
</style>
