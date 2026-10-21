<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { DsButton, DsCard, DsTag } from '@/design-system'
import EmergencyStopButton from './EmergencyStopButton.vue'

const props = defineProps<{ active: boolean; busy?: boolean; error?: string | null }>()
const emit = defineEmits<{ engage: []; resume: [] }>()

// Engaging or resuming swaps the button that had focus: land on the status, which says what just happened (WCAG 2.4.3).
const status = ref<HTMLElement | null>(null)
watch(
  () => props.active,
  async () => {
    await nextTick()
    status.value?.focus()
  },
)
</script>

<template>
  <DsCard as="section" aria-labelledby="stop-title" class="ds-stack">
    <div>
      <h2 id="stop-title">Emergency stop</h2>
      <p class="ds-muted">
        A safety switch for incidents. While it is on, Stream accepts and writes no change to any ad account, on any provider, for anyone.
        Changes already waiting stay where they are. Writes resume only when an admin turns it off. It does not touch the accounts
        themselves: campaigns keep running as they are on Google Ads and Meta.
      </p>
    </div>
    <p ref="status" tabindex="-1" class="status" role="status">
      <DsTag :tone="active ? 'danger' : 'success'">{{ active ? 'Writes are stopped' : 'Writes are enabled' }}</DsTag>
    </p>
    <div>
      <DsButton v-if="active" variant="secondary" :loading="busy" @click="emit('resume')">Resume writes</DsButton>
      <EmergencyStopButton v-else :busy="busy" :error="error" @engage="emit('engage')" />
    </div>
    <p v-if="active && error" class="error" role="alert">{{ error }}</p>
  </DsCard>
</template>

<style scoped>
.status {
  margin: 0;
}
.error {
  color: var(--ds-color-tone-danger-text);
  font-weight: var(--ds-font-weight-medium);
}
</style>
