<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { DsCard, DsMessage } from '@/design-system'

const SCREENS = [
  {
    name: 'lab-bulk',
    title: 'Bulk approval preview',
    text: 'Preview 300 budget changes, see what is held and why, approve once, then retry the items that failed.',
  },
  {
    name: 'lab-template',
    title: 'Template field',
    text: 'Write ad copy with placeholders and keep the filled-in text within 30 characters for every dealer.',
  },
  {
    name: 'lab-rows',
    title: 'Dense list',
    text: 'Filter, sort and page 2,000 campaigns on the server and edit a budget inline, including locked and rate-limited edits.',
  },
]
</script>

<template>
  <div class="ds-page-head">
    <h1>Lab</h1>
    <p class="ds-muted">
      Practice screens built from written specs against a mock backend that previews, partly fails, locks and rate-limits.
    </p>
  </div>
  <div class="ds-stack">
    <DsMessage tone="info">
      Practice area: the data comes from a mock served by the dev server (<code>frontend/lab-api</code>). Nothing here reaches an ad account
      or the governed write path.
    </DsMessage>
    <DsCard v-for="s in SCREENS" :key="s.name" as="article">
      <h2 class="title">
        <RouterLink :to="{ name: s.name }" class="link">{{ s.title }}</RouterLink>
      </h2>
      <p class="ds-muted">{{ s.text }}</p>
    </DsCard>
  </div>
</template>

<style scoped>
.title {
  margin-bottom: var(--ds-space-1);
  font-size: var(--ds-font-size-lg);
}
</style>
