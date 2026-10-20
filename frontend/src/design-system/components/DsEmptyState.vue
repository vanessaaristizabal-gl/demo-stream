<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ title: string; icon?: Component }>()
</script>

<template>
  <div class="ds-empty">
    <component :is="icon" v-if="icon" class="ds-empty__icon" aria-hidden="true" :size="32" />
    <p class="ds-empty__title">{{ title }}</p>
    <p v-if="$slots.default" class="ds-muted"><slot /></p>
  </div>
</template>

<style scoped>
.ds-empty {
  display: grid;
  justify-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-10) var(--ds-space-4);
  text-align: center;
}
.ds-empty__icon {
  color: var(--ds-color-text-muted);
}
.ds-empty__title {
  font-weight: var(--ds-font-weight-semibold);
}
</style>
