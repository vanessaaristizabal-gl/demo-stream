<script setup lang="ts">
import { computed } from 'vue'
import { DsCard, DsPagination, DsTable, useTable, type DsColumn } from '@/design-system'
import type { PlatformInfo, SandboxCampaignDetail, SandboxTotals } from '@/shared/api/types'
import DateText from '@/shared/components/DateText.vue'
import { formatMoney, formatNumber, formatPercent } from '@/shared/utils/format'

const props = defineProps<{ campaign: SandboxCampaignDetail; platform?: PlatformInfo }>()

const FORMATTERS: Record<string, (v: number) => string> = {
  ctr: formatPercent,
  cost: formatMoney,
  average_cpc: formatMoney,
  cpm: formatMoney,
  conversions_value: formatMoney,
  cost_per_conversion: formatMoney,
}

/** One tile per metric the platform reports, with the platform's own field name so people learn the vocabulary. */
const tiles = computed(() =>
  (props.platform?.metrics ?? []).map((m) => {
    const value = props.campaign.totals[m.key as keyof SandboxTotals]
    return { key: m.key, label: m.label, native: m.native, value: value == null ? '—' : (FORMATTERS[m.key] ?? formatNumber)(value) }
  }),
)

const COLUMNS: DsColumn[] = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'impressions', label: 'Impressions', sortable: true, align: 'end' },
  { key: 'clicks', label: 'Clicks', sortable: true, align: 'end' },
  { key: 'cost', label: 'Cost', sortable: true, align: 'end' },
  { key: 'conversions', label: 'Conversions', sortable: true, align: 'end' },
]

const { sort, page, pageCount, pageRows } = useTable(() => props.campaign.daily_metrics, {
  pageSize: 10,
  initialSort: { key: 'date', dir: 'desc' },
})

// Daily spend as bars. The table below holds the same numbers, so the chart is a summary, not the only way in.
const WIDTH = 300
const HEIGHT = 80
const days = computed(() => props.campaign.daily_metrics)
const maxCost = computed(() => Math.max(1, ...days.value.map((d) => d.cost)))
const bars = computed(() => {
  const slot = WIDTH / Math.max(1, days.value.length)
  return days.value.map((d, i) => {
    const h = Math.max(1, (d.cost / maxCost.value) * (HEIGHT - 4))
    return { key: d.date, x: i * slot + slot * 0.15, y: HEIGHT - h, width: slot * 0.7, height: h }
  })
})
const chartLabel = computed(() => {
  const costs = days.value.map((d) => d.cost)
  return costs.length
    ? `Daily spend over ${costs.length} days, from ${formatMoney(Math.min(...costs))} to ${formatMoney(Math.max(...costs))}.`
    : 'No daily spend yet.'
})
</script>

<template>
  <DsCard as="section" aria-labelledby="metrics-title">
    <div class="ds-stack">
      <div>
        <h2 id="metrics-title">Metrics (last {{ campaign.daily_metrics.length }} days, simulated)</h2>
        <p class="ds-muted">{{ platform?.units }}</p>
      </div>

      <dl class="tiles">
        <div v-for="t in tiles" :key="t.key" class="tile">
          <dt>{{ t.label }}</dt>
          <dd class="value">{{ t.value }}</dd>
          <dd class="native">{{ t.native }}</dd>
        </div>
      </dl>

      <figure class="chart">
        <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" role="img" :aria-label="chartLabel" preserveAspectRatio="none">
          <rect v-for="b in bars" :key="b.key" class="bar" :x="b.x" :y="b.y" :width="b.width" :height="b.height" />
        </svg>
        <figcaption class="ds-muted">Daily spend. The table below lists every day.</figcaption>
      </figure>

      <div>
        <DsTable v-model:sort="sort" :columns="COLUMNS" :rows="pageRows" row-key="date" caption="Daily metrics">
          <template #cell-date="{ row }"><DateText :value="row.date" /></template>
          <template #cell-impressions="{ row }">{{ formatNumber(row.impressions) }}</template>
          <template #cell-clicks="{ row }">{{ formatNumber(row.clicks) }}</template>
          <template #cell-cost="{ row }">{{ formatMoney(row.cost) }}</template>
          <template #cell-conversions="{ row }">{{ formatNumber(row.conversions) }}</template>
        </DsTable>
        <DsPagination v-model:page="page" :page-count="pageCount" />
      </div>
    </div>
  </DsCard>
</template>

<style scoped>
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: var(--ds-space-3);
  margin: 0;
}
.tile {
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-subtle);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
}
.tile dt {
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
}
.tile dd {
  margin: 0;
}
.value {
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-bold);
}
.native {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-mono);
  font-size: var(--ds-font-size-xs);
  overflow-wrap: anywhere;
}
.chart {
  margin: 0;
}
.chart svg {
  display: block;
  width: 100%;
  height: 6rem;
}
.bar {
  fill: var(--ds-color-text-link);
}
</style>
