<script setup lang="ts">
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'
import DsButton from './DsButton.vue'
import DsMessage from './DsMessage.vue'

withDefaults(
  defineProps<{
    title: string
    description: string
    confirmLabel: string
    cancelLabel?: string
    tone?: 'primary' | 'danger'
    loading?: boolean
    /** Shown inside the dialog (announced as an alert) when the confirmed action failed. */
    error?: string | null
  }>(),
  { cancelLabel: 'Cancel', tone: 'primary', loading: false, error: null },
)

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ confirm: [] }>()
// Reka AlertDialog: focus is trapped, Escape cancels, focus returns to the trigger, background is inert.
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay class="ds-dialog__overlay" />
      <AlertDialogContent class="ds-dialog">
        <AlertDialogTitle class="ds-dialog__title">{{ title }}</AlertDialogTitle>
        <AlertDialogDescription class="ds-dialog__description">{{ description }}</AlertDialogDescription>
        <DsMessage v-if="error" tone="danger">{{ error }}</DsMessage>
        <div class="ds-dialog__actions">
          <AlertDialogCancel as-child>
            <DsButton variant="secondary" :disabled="loading">{{ cancelLabel }}</DsButton>
          </AlertDialogCancel>
          <DsButton :variant="tone" :loading="loading" @click="emit('confirm')">{{ confirmLabel }}</DsButton>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<style>
/* Portalled to <body>, so these styles are intentionally global (and namespaced). */
.ds-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--ds-z-overlay);
  background: var(--ds-color-bg-overlay);
}
.ds-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: var(--ds-z-dialog);
  display: grid;
  gap: var(--ds-space-3);
  width: min(var(--ds-layout-dialog-max), calc(100vw - var(--ds-space-8)));
  padding: var(--ds-space-6);
  transform: translate(-50%, -50%);
  background: var(--ds-color-bg-surface);
  color: var(--ds-color-text-default);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-lg);
}
.ds-dialog__title {
  margin: 0;
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
}
.ds-dialog__description {
  margin: 0;
  color: var(--ds-color-text-muted);
}
.ds-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ds-space-3);
  margin-top: var(--ds-space-2);
}
</style>
