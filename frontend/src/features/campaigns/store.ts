import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/shared/api/client'
import type { Campaign, CampaignFields, ChangeRequest, Paginated, Resource } from '@/shared/api/types'

export const useCampaignsStore = defineStore('campaigns', () => {
  const items = ref<Campaign[]>([])
  const loading = ref(false)

  async function fetchAll(): Promise<void> {
    loading.value = true
    try {
      items.value = (await api<Paginated<Campaign>>('/campaigns')).data
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number): Promise<Campaign> {
    const campaign = (await api<Resource<Campaign>>(`/campaigns/${id}`)).data
    const i = items.value.findIndex((c) => c.id === id)
    if (i === -1) items.value.push(campaign)
    else items.value[i] = campaign
    return campaign
  }

  /** Every write goes through the governed path; the key makes retries safe. */
  async function submitChange(id: number, changes: Partial<CampaignFields>, idempotencyKey: string): Promise<ChangeRequest> {
    const res = await api<Resource<ChangeRequest>>(`/campaigns/${id}/changes`, {
      method: 'POST',
      body: { changes },
      headers: { 'Idempotency-Key': idempotencyKey },
    })
    return res.data
  }

  return { items, loading, fetchAll, fetchOne, submitChange }
})
