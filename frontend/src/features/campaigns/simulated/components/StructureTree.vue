<script setup lang="ts">
import { computed } from 'vue'
import { DsAccordion, DsCard, DsTag } from '@/design-system'
import type { PlatformInfo, SandboxCampaignDetail } from '@/shared/api/types'

const props = defineProps<{ campaign: SandboxCampaignDetail; platform?: PlatformInfo }>()

// The hierarchy comes from the platform catalog: Google Ads has ad groups, Meta has ad sets.
const groupLabel = computed(() => props.platform?.hierarchy[1] ?? 'Group')
const adLabel = computed(() => props.platform?.hierarchy[2] ?? 'Ad')

const HIDDEN = new Set(['ads', 'kind'])

/** A readable name/value list for one object's own fields; nested objects and lists show as compact JSON. */
function entries(obj: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(obj)
    .filter(([key]) => !HIDDEN.has(key))
    .map(([key, value]) => ({ key, value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value) }))
}

const sections = computed(() => [
  { value: 'campaign', title: 'Campaign', summary: props.campaign.name },
  ...props.campaign.structure.groups.map((g) => ({
    value: `group-${g.id}`,
    title: `${groupLabel.value}: ${g.name}`,
    summary: `${g.ads.length} ${g.ads.length === 1 ? adLabel.value : adLabel.value + 's'}`,
  })),
  { value: 'raw', title: 'Raw JSON payload' },
])

const rawJson = computed(() => JSON.stringify(props.campaign.structure, null, 2))
</script>

<template>
  <DsCard as="section" aria-labelledby="structure-title">
    <div class="ds-stack">
      <div>
        <h2 id="structure-title">Structure</h2>
        <p class="ds-muted">
          What {{ platform?.label ?? 'the platform' }} would hold for this campaign: {{ platform?.hierarchy.join(' > ') }}. Field names are
          the platform's own.
        </p>
      </div>

      <DsAccordion :items="sections" :default-open="['campaign']">
        <template #item-campaign>
          <dl class="fields">
            <template v-for="f in entries(campaign.structure.campaign)" :key="f.key">
              <dt>{{ f.key }}</dt>
              <dd>{{ f.value }}</dd>
            </template>
          </dl>
        </template>

        <template v-for="g in campaign.structure.groups" :key="g.id" #[`item-group-${g.id}`]>
          <DsTag :tone="g.status === 'ENABLED' || g.status === 'ACTIVE' ? 'success' : 'warning'">{{ g.status }}</DsTag>
          <dl class="fields">
            <template v-for="f in entries(g)" :key="f.key">
              <dt>{{ f.key }}</dt>
              <dd>{{ f.value }}</dd>
            </template>
          </dl>
          <ul class="ads" :aria-label="`${adLabel}s in ${g.name}`">
            <li v-for="ad in g.ads" :key="ad.id" class="ad">
              <h4>{{ adLabel }}: {{ ad.name ?? ad.type ?? ad.id }}</h4>
              <dl class="fields">
                <template v-for="f in entries(ad)" :key="f.key">
                  <dt>{{ f.key }}</dt>
                  <dd>{{ f.value }}</dd>
                </template>
              </dl>
            </li>
          </ul>
        </template>

        <template #item-raw>
          <pre class="raw" tabindex="0">{{ rawJson }}</pre>
        </template>
      </DsAccordion>
    </div>
  </DsCard>
</template>

<style scoped>
.fields {
  display: grid;
  grid-template-columns: minmax(8rem, max-content) 1fr;
  gap: var(--ds-space-1) var(--ds-space-4);
  margin: var(--ds-space-2) 0 0;
  font-size: var(--ds-font-size-sm);
}
dt {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-mono, monospace);
  overflow-wrap: anywhere;
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.groups,
.ads {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--ds-space-4);
}
.group {
  padding: var(--ds-space-4);
  background: var(--ds-color-bg-subtle);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
}
.ads {
  margin-top: var(--ds-space-4);
}
.ad {
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-surface);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
}
.raw {
  max-height: 24rem;
  overflow: auto;
  padding: var(--ds-space-3);
  background: var(--ds-color-bg-subtle);
  border: var(--ds-border-width-thin) solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  font-size: var(--ds-font-size-xs);
}
@media (max-width: 45rem) {
  .fields {
    grid-template-columns: 1fr;
  }
}
</style>
