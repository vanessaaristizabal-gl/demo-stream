import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/shared/api/client'
import type { Paginated, PlatformInfo, Resource, SandboxCampaign, SandboxCampaignDetail, SandboxCampaignInput } from '@/shared/api/types'

/** The demo sandbox: simulated Google Ads and Meta campaigns. It never reaches a real account. */
export const useSandboxStore = defineStore('sandbox', () => {
  const items = ref<SandboxCampaign[]>([])
  const platforms = ref<PlatformInfo[]>([])
  const loading = ref(false)

  async function fetchAll(): Promise<void> {
    loading.value = true
    try {
      items.value = (await api<Paginated<SandboxCampaign>>('/sandbox/campaigns')).data
    } finally {
      loading.value = false
    }
  }

  async function fetchCatalog(): Promise<void> {
    platforms.value = (await api<Resource<{ platforms: PlatformInfo[] }>>('/sandbox/catalog')).data.platforms
  }

  async function fetchOne(id: number): Promise<SandboxCampaignDetail> {
    return (await api<Resource<SandboxCampaignDetail>>(`/sandbox/campaigns/${id}`)).data
  }

  /** The key makes a retried submit return the same campaign instead of creating a second one. */
  async function create(input: SandboxCampaignInput, idempotencyKey: string): Promise<SandboxCampaignDetail> {
    const created = (
      await api<Resource<SandboxCampaignDetail>>('/sandbox/campaigns', {
        method: 'POST',
        body: input,
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data
    items.value = [created, ...items.value.filter((c) => c.id !== created.id)]
    return created
  }

  return { items, platforms, loading, fetchAll, fetchCatalog, fetchOne, create }
})
