<script setup lang="ts">
import { ref, watch } from 'vue'
import { OctagonX } from 'lucide-vue-next'
import { DsButton, DsConfirmDialog } from '@/design-system'

const props = defineProps<{ busy?: boolean; error?: string | null }>()
const emit = defineEmits<{ engage: [] }>()

const open = ref(false)

// Engaging is dangerous, so it always asks first. The dialog closes when the request succeeds; on failure it stays
// open and shows why, so a failed stop is never silent.
watch(
  () => props.busy,
  (now, was) => {
    if (was && !now && !props.error) open.value = false
  },
)
</script>

<template>
  <!-- Phones show the icon only; aria-label keeps the name. -->
  <DsButton variant="danger" :icon="OctagonX" aria-label="Emergency stop" title="Emergency stop" @click="open = true">
    <span class="stop-label">Emergency stop</span>
  </DsButton>
  <DsConfirmDialog
    v-model:open="open"
    title="Stop all writes?"
    description="No change will be accepted or written to any ad account until an admin resumes writes."
    confirm-label="Engage emergency stop"
    tone="danger"
    :loading="busy"
    :error="error"
    @confirm="emit('engage')"
  />
</template>

<style scoped>
@media (max-width: 45rem) {
  .stop-label {
    display: none;
  }
}
</style>
