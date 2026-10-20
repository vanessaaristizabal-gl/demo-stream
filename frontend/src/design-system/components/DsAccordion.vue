<script setup lang="ts">
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'
import { ChevronDown } from 'lucide-vue-next'

export interface DsAccordionItem {
  value: string
  title: string
  /** A short summary beside the title that stays visible while the section is closed. */
  summary?: string
}

withDefaults(defineProps<{ items: DsAccordionItem[]; defaultOpen?: string[] }>(), { defaultOpen: () => [] })

defineSlots<Record<`item-${string}`, (() => unknown) | undefined>>()
// Reka Accordion: each header is a heading with a button (aria-expanded, aria-controls), arrow keys move between headers.
// Several sections can be open at once; closed content is not mounted.
</script>

<template>
  <AccordionRoot type="multiple" :default-value="defaultOpen" class="ds-accordion">
    <AccordionItem v-for="item in items" :key="item.value" :value="item.value" class="ds-accordion__item">
      <AccordionHeader class="ds-accordion__header">
        <AccordionTrigger class="ds-accordion__trigger">
          <span class="ds-accordion__title">{{ item.title }}</span>
          <span v-if="item.summary" class="ds-accordion__summary">{{ ' ' }}{{ item.summary }}</span>
          <ChevronDown class="ds-accordion__chevron" aria-hidden="true" :size="18" />
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent class="ds-accordion__content">
        <div class="ds-accordion__inner"><slot :name="`item-${item.value}`" /></div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>

<style scoped>
.ds-accordion {
  display: grid;
  gap: var(--ds-space-3);
}
.ds-accordion__item {
  background: var(--ds-color-bg-surface);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
}
.ds-accordion__header {
  margin: 0;
  font-size: var(--ds-font-size-md, 1rem);
}
.ds-accordion__trigger {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  width: 100%;
  min-height: var(--ds-size-control-md);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: transparent;
  color: var(--ds-color-text-default);
  border: 0;
  border-radius: var(--ds-radius-md);
  font: inherit;
  font-weight: var(--ds-font-weight-semibold);
  text-align: start;
  cursor: pointer;
}
.ds-accordion__trigger:hover {
  background: var(--ds-color-bg-hover);
}
.ds-accordion__summary {
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-regular, 400);
}
.ds-accordion__chevron {
  margin-inline-start: auto;
  flex: none;
  transition: transform 150ms ease;
}
.ds-accordion__trigger[data-state='open'] .ds-accordion__chevron {
  transform: rotate(180deg);
}
.ds-accordion__inner {
  padding: var(--ds-space-2) var(--ds-space-4) var(--ds-space-4);
  border-top: var(--ds-border-width-thin) solid var(--ds-color-border-default);
}
</style>
