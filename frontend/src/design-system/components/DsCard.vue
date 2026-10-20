<script setup lang="ts">
withDefaults(defineProps<{ as?: 'div' | 'article' | 'section'; padded?: boolean }>(), { as: 'div', padded: true })
</script>

<template>
  <component :is="as" class="ds-card" :class="{ 'ds-card--padded': padded }"><slot /></component>
</template>

<style scoped>
.ds-card {
  background: var(--ds-color-bg-surface);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
}
.ds-card--padded {
  padding: var(--ds-space-5);
}
@media (max-width: 45rem) {
  .ds-card--padded {
    padding: var(--ds-space-4);
  }
}
</style>
