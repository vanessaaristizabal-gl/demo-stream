<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { DsBreadcrumb, DsButton, type DsBreadcrumbItem } from '@/design-system'

defineProps<{ crumbs: DsBreadcrumbItem[]; canGoBack: boolean }>()
const emit = defineEmits<{ back: []; navigate: [item: DsBreadcrumbItem] }>()
</script>

<template>
  <div v-if="crumbs.length || canGoBack" class="page-nav">
    <DsButton v-if="canGoBack" variant="ghost" size="sm" :icon="ArrowLeft" @click="emit('back')">Back</DsButton>
    <DsBreadcrumb v-if="crumbs.length" :items="crumbs" @navigate="emit('navigate', $event)" />
  </div>
</template>

<style scoped>
.page-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
  margin-bottom: var(--ds-space-4);
}
</style>
