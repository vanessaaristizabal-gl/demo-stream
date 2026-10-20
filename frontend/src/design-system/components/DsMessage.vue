<script setup lang="ts">
import { computed } from 'vue'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ tone?: 'info' | 'success' | 'warning' | 'danger'; role?: 'alert' | 'status' }>(), {
  tone: 'info',
  role: undefined,
})

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert }
const icon = computed(() => ICONS[props.tone])
// Errors interrupt (alert); everything else is polite (status). WCAG 4.1.3.
const liveRole = computed(() => props.role ?? (props.tone === 'danger' ? 'alert' : 'status'))
</script>

<template>
  <div class="ds-message" :class="`ds-message--${tone}`" :role="liveRole">
    <component :is="icon" class="ds-message__icon" aria-hidden="true" :size="20" />
    <div class="ds-message__body"><slot /></div>
  </div>
</template>

<style scoped>
.ds-message {
  display: flex;
  gap: var(--ds-space-3);
  align-items: flex-start;
  padding: var(--ds-space-3) var(--ds-space-4);
  border: var(--ds-border-width-thin) solid;
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-font-size-sm);
}
.ds-message__icon {
  flex: none;
  margin-top: 1px;
}
.ds-message__body {
  min-width: 0;
}
.ds-message--info {
  background: var(--ds-color-tone-info-bg);
  color: var(--ds-color-tone-info-text);
  border-color: var(--ds-color-tone-info-border);
}
.ds-message--success {
  background: var(--ds-color-tone-success-bg);
  color: var(--ds-color-tone-success-text);
  border-color: var(--ds-color-tone-success-border);
}
.ds-message--warning {
  background: var(--ds-color-tone-warning-bg);
  color: var(--ds-color-tone-warning-text);
  border-color: var(--ds-color-tone-warning-border);
}
.ds-message--danger {
  background: var(--ds-color-tone-danger-bg);
  color: var(--ds-color-tone-danger-text);
  border-color: var(--ds-color-tone-danger-border);
}
</style>
