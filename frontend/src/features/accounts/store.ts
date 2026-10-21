import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/shared/api/client'
import type { Account, AccountDetail, ChangelogEntry, Paginated, Resource } from '@/shared/api/types'

export const useAccountsStore = defineStore('accounts', () => {
  const items = ref<Account[]>([])
  const loading = ref(false)

  async function fetchAll(): Promise<void> {
    loading.value = true
    try {
      items.value = (await api<Paginated<Account>>('/accounts')).data
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number): Promise<AccountDetail> {
    return (await api<Resource<AccountDetail>>(`/accounts/${id}`)).data
  }

  /** The changes recorded on this account's campaigns, newest first (edits made in Google Ads or Meta included). */
  async function fetchChangelog(id: number): Promise<ChangelogEntry[]> {
    return (await api<Paginated<ChangelogEntry>>(`/changelog?account_id=${id}`)).data
  }

  return { items, loading, fetchAll, fetchOne, fetchChangelog }
})
