<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

export interface DsBreadcrumbItem {
  label: string
  href: string
}

withDefaults(defineProps<{ items: DsBreadcrumbItem[]; label?: string }>(), { label: 'Breadcrumb' })
const emit = defineEmits<{ navigate: [item: DsBreadcrumbItem] }>()

function onClick(event: MouseEvent, item: DsBreadcrumbItem): void {
  // Let the browser handle "open in new tab/window" gestures; intercept only a plain click.
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  emit('navigate', item)
}
</script>

<template>
  <nav class="ds-breadcrumb" :aria-label="label">
    <ol class="ds-breadcrumb__list">
      <li v-for="(item, i) in items" :key="item.href + i" class="ds-breadcrumb__item">
        <ChevronRight v-if="i > 0" class="ds-breadcrumb__separator" aria-hidden="true" :size="16" />
        <span v-if="i === items.length - 1" class="ds-breadcrumb__current" aria-current="page">{{ item.label }}</span>
        <a v-else :href="item.href" class="ds-breadcrumb__link" @click="onClick($event, item)">{{ item.label }}</a>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.ds-breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--ds-font-size-sm);
}
.ds-breadcrumb__item {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
  min-width: 0;
}
.ds-breadcrumb__separator {
  flex: none;
  color: var(--ds-color-text-muted);
}
.ds-breadcrumb__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--ds-size-target-min);
  color: var(--ds-color-text-link);
  font-weight: var(--ds-font-weight-medium);
}
.ds-breadcrumb__current {
  color: var(--ds-color-text-default);
  font-weight: var(--ds-font-weight-semibold);
  overflow-wrap: anywhere;
}
</style>
