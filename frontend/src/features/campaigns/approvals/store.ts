import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/shared/api/client'
import type { ChangeRequest, ChangeStatus, Paginated, Resource } from '@/shared/api/types'

export const useChangeRequestsStore = defineStore('changeRequests', () => {
  const items = ref<ChangeRequest[]>([])
  const loading = ref(false)

  const pending = computed(() => items.value.filter((r) => r.status === 'pending_approval'))

  async function fetchAll(status?: ChangeStatus): Promise<void> {
    loading.value = true
    try {
      const query = status ? `?status=${status}` : ''
      items.value = (await api<Paginated<ChangeRequest>>(`/change-requests${query}`)).data
    } finally {
      loading.value = false
    }
  }

  function replace(updated: ChangeRequest): void {
    const i = items.value.findIndex((r) => r.id === updated.id)
    if (i !== -1) items.value[i] = { ...items.value[i], ...updated }
  }

  async function decide(id: number, action: 'approve' | 'reject'): Promise<ChangeRequest> {
    const updated = (await api<Resource<ChangeRequest>>(`/change-requests/${id}/${action}`, { method: 'POST' })).data
    replace(updated)
    return updated
  }

  return {
    items,
    loading,
    pending,
    fetchAll,
    approve: (id: number) => decide(id, 'approve'),
    reject: (id: number) => decide(id, 'reject'),
  }
})
