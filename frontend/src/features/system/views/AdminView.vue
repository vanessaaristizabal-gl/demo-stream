<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { DsMessage, DsTabs } from '@/design-system'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import { useTabQuery } from '@/shared/composables/useTabQuery'
import EmergencyStopPanel from '../components/EmergencyStopPanel.vue'
import RulebooksTable from '../components/RulebooksTable.vue'
import { useSystemStore } from '../store'

const system = useSystemStore()
const tab = useTabQuery(['safety', 'rulebooks'] as const, 'safety')
const tabs = [
  { value: 'safety', label: 'Emergency stop' },
  { value: 'rulebooks', label: 'OEM rulebooks' },
]

const stop = useAsyncAction((active: boolean) => system.setEmergencyStop(active))

// The rulebooks are fetched when their tab opens: most visits only come for the emergency stop.
const rulebooksError = ref<string | null>(null)
watch(
  tab,
  async (current) => {
    if (current !== 'rulebooks' || system.rulebooks.length > 0) return
    rulebooksError.value = null
    try {
      await system.fetchRulebooks()
    } catch (e) {
      rulebooksError.value = e instanceof Error ? e.message : 'The rulebooks could not be loaded.'
    }
  },
  { immediate: true },
)
onMounted(() => system.load())
</script>

<template>
  <div class="ds-page-head">
    <h1>Admin</h1>
    <p class="ds-muted">
      Controls for admins: the switch that stops all writes in an incident, and the manufacturer rules every change is checked against.
    </p>
  </div>
  <DsTabs v-model="tab" label="Admin sections" :items="tabs">
    <template #panel-safety>
      <EmergencyStopPanel
        :active="system.emergencyStop"
        :busy="stop.pending.value"
        :error="stop.error.value?.message"
        @engage="stop.run(true)"
        @resume="stop.run(false)"
      />
    </template>
    <template #panel-rulebooks>
      <DsMessage v-if="rulebooksError" tone="danger">{{ rulebooksError }}</DsMessage>
      <RulebooksTable v-else :rulebooks="system.rulebooks" />
    </template>
  </DsTabs>
</template>
