import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as client from '@/shared/api/client'
import { makeAccount } from '@/shared/test/factories'
import { useAccountsStore } from './store'

vi.mock('@/shared/api/client', async (orig) => ({ ...(await orig<typeof client>()), api: vi.fn() }))
const api = vi.mocked(client.api)

beforeEach(() => {
  setActivePinia(createPinia())
  api.mockReset()
})

describe('accounts store', () => {
  it('loads the list and resets loading, even when the request fails', async () => {
    api.mockResolvedValueOnce({ data: [makeAccount()] })
    const store = useAccountsStore()
    await store.fetchAll()
    expect(api).toHaveBeenCalledWith('/accounts')
    expect(store.items).toHaveLength(1)
    expect(store.loading).toBe(false)

    api.mockRejectedValueOnce(new client.ApiError(500, 'Down'))
    await expect(store.fetchAll()).rejects.toThrow('Down')
    expect(store.loading).toBe(false)
    expect(store.items).toHaveLength(1)
  })

  it('loads one account with its campaigns', async () => {
    api.mockResolvedValueOnce({ data: { ...makeAccount(), campaigns: [] } })
    const detail = await useAccountsStore().fetchOne(3)
    expect(api).toHaveBeenCalledWith('/accounts/3')
    expect(detail.campaigns).toEqual([])
  })

  it("loads the changelog of one account's campaigns", async () => {
    api.mockResolvedValueOnce({ data: [] })
    await useAccountsStore().fetchChangelog(3)
    expect(api).toHaveBeenCalledWith('/changelog?account_id=3')
  })
})
