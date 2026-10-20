<script setup lang="ts">
import { computed } from 'vue'
import { DsAccordion, DsCard, DsTable, DsTag, type DsColumn } from '@/design-system'
import type { PlatformInfo } from '@/shared/api/types'

const props = withDefaults(defineProps<{ platforms: PlatformInfo[]; defaultOpen?: string[] }>(), { defaultOpen: undefined })

const sections = computed(() => props.platforms.map((p) => ({ value: p.platform, title: p.label, summary: `${p.metrics.length} metrics` })))

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
        <h2 id="guide-title">{{ platforms.length === 1 ? `What ${platforms[0].label} collects` : 'What each platform collects' }}</h2>
        <p class="ds-muted">
          The sandbox mirrors the vocabulary of the Google Ads API and the Meta Marketing API. Nothing here reaches a real account.
        </p>
      </div>
      <DsAccordion :items="sections" :default-open="defaultOpen ?? platforms.slice(0, 1).map((p) => p.platform)">
        <template v-for="p in platforms" :key="p.platform" #[`item-${p.platform}`]>
          <div class="ds-stack">
            <p class="ds-row">
              <DsTag v-for="level in p.hierarchy" :key="level" tone="info">{{ level }}</DsTag>
            </p>
            <p class="ds-muted">
              The goal is stored in <code>{{ p.goal_setting }}</code
              >: {{ p.goals.map((g) => `${g.label} = ${g.native}`).join(', ') }}.
            </p>
            <DsTable :columns="COLUMNS" :rows="p.metrics" row-key="key" :caption="`${p.label} metrics`" />
          </div>
        </template>
      </DsAccordion>
    </div>
  </DsCard>
</template>
