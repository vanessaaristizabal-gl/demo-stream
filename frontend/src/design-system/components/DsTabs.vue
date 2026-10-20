<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

export interface DsTabItem {
  value: string
  label: string
  /** A number shown beside the label, such as how many rows the tab holds. */
  count?: number
}

defineProps<{ label: string; items: DsTabItem[] }>()
const model = defineModel<string>({ required: true })

defineSlots<Record<`panel-${string}`, (() => unknown) | undefined>>()
// Reka Tabs: roving tabindex, arrow keys, Home and End, role="tablist"/"tab"/"tabpanel". Only the active panel is mounted, so a
// heavy panel costs nothing until it is opened.
</script>

<template>
  <TabsRoot v-model="model" class="ds-tabs" activation-mode="automatic">
    <TabsList class="ds-tabs__list" :aria-label="label">
      <TabsTrigger v-for="item in items" :key="item.value" :value="item.value" class="ds-tabs__trigger">
        {{ item.label }}
        <span v-if="item.count !== undefined" class="ds-tabs__count">{{ item.count }}</span>
      </TabsTrigger>
    </TabsList>
    <TabsContent v-for="item in items" :key="item.value" :value="item.value" class="ds-tabs__panel">
      <slot :name="`panel-${item.value}`" />
    </TabsContent>
  </TabsRoot>
</template>

<style scoped>
.ds-tabs__list {
  display: flex;
  gap: var(--ds-space-1);
  overflow-x: auto;
  border-bottom: var(--ds-border-width-thin) solid var(--ds-color-border-default);
}
.ds-tabs__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex: none;
  min-height: var(--ds-size-target-min);
  padding: 0 var(--ds-space-4);
  background: transparent;
  color: var(--ds-color-text-muted);
  border: 0;
  border-bottom: var(--ds-border-width-thick) solid transparent;
  margin-bottom: calc(-1 * var(--ds-border-width-thin));
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  white-space: nowrap;
  cursor: pointer;
}
.ds-tabs__trigger:hover {
  color: var(--ds-color-text-default);
  background: var(--ds-color-bg-hover);
}
.ds-tabs__trigger[data-state='active'] {
  color: var(--ds-color-text-default);
  font-weight: var(--ds-font-weight-semibold);
  border-bottom-color: var(--ds-color-action-primary-bg);
}
.ds-tabs__count {
  padding: 0 var(--ds-space-2);
  background: var(--ds-color-tone-neutral-bg);
  color: var(--ds-color-tone-neutral-text);
  border-radius: var(--ds-radius-full);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
}
.ds-tabs__panel {
  padding-top: var(--ds-space-4);
}
</style>
