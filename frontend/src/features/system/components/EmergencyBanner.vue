<script setup lang="ts">
import { ref } from 'vue'
import { DsButton, DsMessage } from '@/design-system'

defineProps<{ canResume?: boolean; busy?: boolean }>()
const emit = defineEmits<{ resume: [] }>()

const root = ref<HTMLElement | null>(null)
// The button that engaged the stop disappears with it; the app moves focus here so keyboard users are not dropped on <body>.
defineExpose({ focus: () => root.value?.focus() })
</script>

<template>
  <div ref="root" class="banner" tabindex="-1">
    <DsMessage tone="danger">
      <div class="ds-row">
        <strong>Emergency stop is active.</strong>
        <span>No changes are being written to any ad account.</span>
        <DsButton v-if="canResume" variant="secondary" size="sm" :loading="busy" @click="emit('resume')">Resume writes</DsButton>
      </div>
    </DsMessage>
  </div>
</template>

<style scoped>
.banner:focus-visible {
  outline-offset: -2px;
}
.banner {
  padding: var(--ds-space-3) var(--ds-space-6);
  background: var(--ds-color-bg-canvas);
}
@media (max-width: 45rem) {
  .banner {
    padding: var(--ds-space-2) var(--ds-space-4);
  }
}
</style>
