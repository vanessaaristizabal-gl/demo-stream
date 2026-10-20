<script setup lang="ts">
import { DsCard, DsTable, DsTag, type DsColumn } from '@/design-system'
import type { PlatformInfo } from '@/shared/api/types'

defineProps<{ platforms: PlatformInfo[] }>()

const COLUMNS: DsColumn[] = [
  { key: 'label', label: 'Metric' },
  { key: 'native', label: 'API field' },
  { key: 'description', label: 'What it measures' },
]
</script>

<template>
  <DsCard as="section" aria-labelledby="guide-title">
    <div class="ds-stack">
      <div>
        <h2 id="guide-title">What each platform collects</h2>
        <p class="ds-muted">
          The sandbox mirrors the vocabulary of the Google Ads API and the Meta Marketing API. Nothing here reaches a real account.
        </p>
      </div>
      <section v-for="p in platforms" :key="p.platform" class="ds-stack" :aria-labelledby="`guide-${p.platform}`">
        <h3 :id="`guide-${p.platform}`">{{ p.label }}</h3>
        <p class="ds-row">
          <DsTag v-for="level in p.hierarchy" :key="level" tone="info">{{ level }}</DsTag>
        </p>
        <p class="ds-muted">
          The goal is stored in <code>{{ p.goal_setting }}</code
          >: {{ p.goals.map((g) => `${g.label} = ${g.native}`).join(', ') }}.
        </p>
        <DsTable :columns="COLUMNS" :rows="p.metrics" row-key="key" :caption="`${p.label} metrics`" />
      </section>
    </div>
  </DsCard>
</template>
