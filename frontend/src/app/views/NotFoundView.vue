<script setup lang="ts">
import { SearchX } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { DsCard, DsEmptyState } from '@/design-system'
</script>

<template>
  <div class="ds-page-head">
    <h1>Page not found</h1>
  </div>
  <DsCard>
    <DsEmptyState title="We could not find that page" :icon="SearchX">
      Check the address, or <RouterLink :to="{ name: 'campaigns' }">go to campaigns</RouterLink>.
    </DsEmptyState>
  </DsCard>
</template>
