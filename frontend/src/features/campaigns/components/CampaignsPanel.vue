<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from 'lucide-vue-next'
import { DsButton, DsMessage } from '@/design-system'
import type { PlatformInfo } from '@/shared/api/types'
import PlatformGuide from '../simulated/components/PlatformGuide.vue'
import type { CampaignRow } from '../rows'
import CampaignTable from './CampaignTable.vue'

const props = defineProps<{ rows: CampaignRow[]; platform?: PlatformInfo }>()
const emit = defineEmits<{
  open: [row: CampaignRow]
  edit: [row: CampaignRow]
  remove: [row: CampaignRow]
  account: [accountId: number]
  create: []
}>()
const guide = computed(() => (props.platform ? [props.platform] : []))
</script>

<template>
  <div class="ds-stack">
    <div class="ds-row bar">
      <DsMessage tone="info" class="note">
        Live campaigns change only through approval: <em>Request a change</em> opens a change request. Simulated campaigns (demo, never
        reach a real account) can be edited and deleted directly.
      </DsMessage>
      <DsButton :icon="Plus" @click="emit('create')">New simulated campaign</DsButton>
    </div>
    <CampaignTable
      :rows="rows"
      @open="emit('open', $event)"
      @edit="emit('edit', $event)"
      @remove="emit('remove', $event)"
      @account="emit('account', $event)"
    />
    <PlatformGuide v-if="platform" :platforms="guide" :default-open="[]" />
  </div>
</template>

<style scoped>
.bar {
  align-items: flex-start;
  justify-content: space-between;
}
.note {
  flex: 1 1 24rem;
}
</style>
