import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/shared/api/client'
import type { ChangelogEntry, Paginated } from '@/shared/api/types'

export const useChangelogStore = defineStore('changelog', () => {
  const items = ref<ChangelogEntry[]>([])
  const source = ref<'all' | 'platform' | 'external'>('all')
  const loading = ref(false)

  async function fetchAll(): Promise<void> {
    loading.value = true
    try {
      const query = source.value === 'all' ? '' : `?source=${source.value}`
      items.value = (await api<Paginated<ChangelogEntry>>(`/changelog${query}`)).data
    } finally {
      loading.value = false
    }
  }

  return { items, source, loading, fetchAll }
})
