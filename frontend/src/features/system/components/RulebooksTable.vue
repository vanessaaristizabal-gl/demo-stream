<script setup lang="ts">
import { computed } from 'vue'
import { ScrollText } from 'lucide-vue-next'
import { DsAccordion, DsCard, DsEmptyState, DsTag } from '@/design-system'
import type { Rulebook } from '@/shared/api/types'
import { formatDate } from '@/shared/utils/format'

const props = defineProps<{ rulebooks: Rulebook[] }>()

// An effective date is a calendar date, not a moment: the API sends it at midnight UTC, so show it in UTC. In the viewer's time zone
// it would read as the day before for anyone west of Greenwich.
const day = (iso: string): string => formatDate(iso, 'UTC')
const label = (r: Rulebook): string => `${r.manufacturer[0].toUpperCase()}${r.manufacturer.slice(1)} rulebook v${r.version}`
const items = computed(() =>
  props.rulebooks.map((r) => ({
    value: String(r.id),
    title: label(r),
    summary: `${r.rules.length} ${r.rules.length === 1 ? 'rule' : 'rules'}, effective ${day(r.effective_from)}${r.effective_to ? ` to ${day(r.effective_to)}` : ''}`,
  })),
)
const current = (r: Rulebook): boolean => r.effective_to === null
</script>

<template>
  <DsCard v-if="rulebooks.length === 0">
    <DsEmptyState title="No rulebooks yet" :icon="ScrollText"
      >Manufacturer rules, with their effective dates, will appear here.</DsEmptyState
    >
  </DsCard>
  <DsAccordion v-else :items="items" :default-open="[]">
    <template v-for="r in rulebooks" :key="r.id" #[`item-${r.id}`]>
      <p v-if="current(r)"><DsTag tone="success">Current version</DsTag></p>
      <ul class="rules" :aria-label="`Rules of ${label(r)}`">
        <li v-for="rule in r.rules" :key="rule.id">
          <strong>{{ rule.id }}</strong
          >: {{ rule.message }}
          <span class="ds-muted"
            >({{ rule.field }} {{ rule.operator }}<template v-if="rule.value !== undefined"> {{ rule.value }}</template
            >)</span
          >
        </li>
      </ul>
    </template>
  </DsAccordion>
</template>

<style scoped>
.rules {
  display: grid;
  gap: var(--ds-space-2);
  margin: var(--ds-space-2) 0 0;
  padding-left: var(--ds-space-5);
}
</style>
