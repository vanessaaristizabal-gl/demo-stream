<script setup lang="ts">
import { computed } from 'vue'
import { DsInput, DsMessage, DsSelect, DsTag, type DsOption } from '@/design-system'
import type { LabDealer } from '@/shared/api/types'
import { fillTemplate, TEMPLATE_LIMIT } from '../template'

const props = defineProps<{ dealers: LabDealer[]; dealerId: string }>()
const template = defineModel<string>({ default: '' })
const emit = defineEmits<{ 'update:dealerId': [id: string] }>()

const HINT =
  'Placeholders such as {{ dealer.name }} and {{ dealer.city }} are filled in when the ad is built. The limit applies to the filled-in text.'

const dealerOptions = computed<DsOption[]>(() => props.dealers.map((d) => ({ label: d.name, value: d.id })))
const dealer = computed(() => props.dealers.find((d) => d.id === props.dealerId) ?? props.dealers[0])

const filled = computed(() => fillTemplate(template.value, dealer.value))
const isEmpty = computed(() => template.value.trim() === '')
const overBy = computed(() => (unknown.value.length === 0 && !isEmpty.value ? Math.max(0, filled.value.text.length - TEMPLATE_LIMIT) : 0))
const unknown = computed(() => [...filled.value.unknown, ...filled.value.malformed])

const tooLong = computed(() =>
  props.dealers.map((d) => ({ dealer: d, length: fillTemplate(template.value, d).text.length })).filter((r) => r.length > TEMPLATE_LIMIT),
)

const errorText = computed(() => {
  if (filled.value.malformed.length > 0) return `Malformed placeholder: ${filled.value.malformed.join(', ')}`
  if (unknown.value.length > 0) return `Unknown placeholder: ${unknown.value.join(', ')}`
  if (overBy.value > 0)
    return `${overBy.value} ${overBy.value === 1 ? 'character' : 'characters'} over the ${TEMPLATE_LIMIT} character limit`
  return null
})
const state = computed(() =>
  isEmpty.value ? 'empty' : unknown.value.length ? 'unknown-placeholder' : overBy.value ? 'over-limit' : 'valid',
)
</script>

<template>
  <div class="ds-stack" :data-state="state">
    <DsSelect
      :model-value="dealerId"
      label="Preview as dealer"
      :options="dealerOptions"
      @update:model-value="emit('update:dealerId', $event)"
    />

    <div class="ds-stack field">
      <DsInput v-model="template" label="Ad headline template" :hint="HINT" :error="errorText ?? undefined" autocomplete="off" />
      <p class="count" :class="{ 'count--over': overBy > 0 }" role="status">
        {{ filled.text.length }} / {{ TEMPLATE_LIMIT }} characters for {{ dealer?.name }}
      </p>
    </div>

    <p v-if="isEmpty" class="ds-muted">Type a template to see how it reads for each dealer.</p>
    <div v-else>
      <h2 class="section-title">Preview</h2>
      <p class="preview" :class="{ 'preview--draft': unknown.length > 0 }">{{ filled.text }}</p>
      <DsTag v-if="unknown.length > 0" tone="warning">Draft: fix the placeholders first, the length is not final</DsTag>
    </div>

    <DsMessage v-if="!isEmpty && unknown.length === 0 && tooLong.length > 0" tone="warning">
      <p>Too long for {{ tooLong.length }} {{ tooLong.length === 1 ? 'dealer' : 'dealers' }}:</p>
      <ul class="dealer-list">
        <li v-for="r in tooLong" :key="r.dealer.id">{{ r.dealer.name }} ({{ r.length }} characters)</li>
      </ul>
    </DsMessage>
  </div>
</template>

<style scoped>
.section-title {
  margin-bottom: var(--ds-space-2);
  font-size: var(--ds-font-size-lg);
}
.field {
  gap: var(--ds-space-1);
}
.count {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
}
.count--over {
  color: var(--ds-color-tone-danger-text);
  font-weight: var(--ds-font-weight-medium);
}
.preview {
  padding: var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-color-bg-subtle);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  overflow-wrap: anywhere;
}
.preview--draft {
  border-style: dashed;
}
.dealer-list {
  margin: var(--ds-space-1) 0 0;
  padding-left: var(--ds-space-5);
}
</style>
