<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DsMessage, DsTabs, DsTag } from '@/design-system'
import type { AccountDetail, ChangelogEntry } from '@/shared/api/types'
import { useCrumbLabel } from '@/shared/composables/useBreadcrumbs'
import { useTabQuery } from '@/shared/composables/useTabQuery'
import { formatMoney } from '@/shared/utils/format'
import AccountCampaigns from '../components/AccountCampaigns.vue'
import AccountChangelog from '../components/AccountChangelog.vue'
import LaunchPanel from '../launch/LaunchPanel.vue'
import { useAccountsStore } from '../store'

const props = defineProps<{ id: number }>()
const store = useAccountsStore()
const router = useRouter()

const account = ref<AccountDetail | null>(null)
const changelog = ref<ChangelogEntry[] | null>(null)
const error = ref<string | null>(null)
useCrumbLabel(() => account.value?.dealer_name)

// Launching the playbook's campaigns happens here, on the account it is for. It runs on a mock backend served by the
// development server, so the tab exists only there.
const tab = useTabQuery(['campaigns', 'launch', 'changelog'] as const, 'campaigns')
const tabs = computed(() => [
  { value: 'campaigns', label: 'Campaigns', count: account.value?.campaigns_count },
  ...(import.meta.env.DEV ? [{ value: 'launch', label: 'Launch' }] : []),
  { value: 'changelog', label: 'Changelog' },
])

// The route reuses this component between accounts, so follow the id instead of loading once on mount.
watch(
  () => props.id,
  async (id) => {
    account.value = null
    changelog.value = null
    error.value = null
    try {
      account.value = await store.fetchOne(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'The account could not be loaded.'
    }
  },
  { immediate: true },
)

// The changelog is fetched when its tab is opened, not before: most visits never look at it.
watch(
  [tab, account],
  async ([current, loaded]) => {
    if (current === 'changelog' && loaded && changelog.value === null) changelog.value = await store.fetchChangelog(loaded.id)
  },
  { immediate: true },
)
</script>

<template>
  <DsMessage v-if="error" tone="danger">{{ error }}</DsMessage>
  <p v-else-if="!account" class="ds-muted" role="status">Loading account…</p>
  <div v-else class="ds-stack">
    <div class="ds-page-head">
      <h1 class="ds-row">
        {{ account.dealer_name }} <DsTag tone="info">{{ account.provider === 'google' ? 'Google Ads' : 'Meta Ads' }}</DsTag>
      </h1>
      <dl class="facts">
        <div>
          <dt>OEM</dt>
          <dd>{{ account.manufacturer ?? '—' }}</dd>
        </div>
        <div>
          <dt>Account id</dt>
          <dd>{{ account.external_id }}</dd>
        </div>
        <div>
          <dt>Monthly budget</dt>
          <dd>
            <DsTag v-if="account.monthly_budget === null" tone="warning">No budget in Salesforce</DsTag>
            <template v-else>{{ formatMoney(account.monthly_budget) }}</template>
          </dd>
        </div>
      </dl>
    </div>
    <DsTabs v-model="tab" label="Account sections" :items="tabs">
      <template #panel-campaigns>
        <AccountCampaigns :campaigns="account.campaigns" @open="(c) => router.push({ name: 'campaign', params: { id: c.id } })" />
      </template>
      <template #panel-launch>
        <LaunchPanel :key="account.id" :account="account" />
      </template>
      <template #panel-changelog>
        <p v-if="changelog === null" class="ds-muted" role="status">Loading the changelog…</p>
        <AccountChangelog v-else :entries="changelog" />
      </template>
    </DsTabs>
  </div>
</template>

<style scoped>
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-6);
  margin: var(--ds-space-2) 0 0;
}
.facts dt {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
}
.facts dd {
  margin: 0;
  font-weight: var(--ds-font-weight-semibold);
}
</style>
