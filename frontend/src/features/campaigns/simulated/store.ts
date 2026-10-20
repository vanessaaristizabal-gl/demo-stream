import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/shared/api/client'
import type {
  Paginated,
  PlatformInfo,
  Resource,
  SandboxCampaign,
  SandboxCampaignDetail,
  SandboxCampaignInput,
  SandboxCampaignUpdate,
} from '@/shared/api/types'

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

  /** Direct edit: a simulated campaign has no live account to protect. The key makes a retried edit safe. */
  async function update(id: number, changes: SandboxCampaignUpdate, idempotencyKey: string): Promise<SandboxCampaignDetail> {
    const saved = (
      await api<Resource<SandboxCampaignDetail>>(`/sandbox/campaigns/${id}`, {
        method: 'PATCH',
        body: changes,
        headers: { 'Idempotency-Key': idempotencyKey },
      })
    ).data
    items.value = items.value.map((c) => (c.id === id ? { ...c, ...saved } : c))
    return saved
  }

  /** Removes the simulated campaign. Live campaigns are never deleted from here (they change only through approval). */
  async function remove(id: number, idempotencyKey: string): Promise<void> {
    await api<void>(`/sandbox/campaigns/${id}`, { method: 'DELETE', headers: { 'Idempotency-Key': idempotencyKey } })
    items.value = items.value.filter((c) => c.id !== id)
  }

  return { items, platforms, loading, fetchAll, fetchCatalog, fetchOne, create, update, remove }
})
