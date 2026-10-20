import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as client from '@/shared/api/client'
import { makeCampaign, makeChangeRequest } from '@/shared/test/factories'
import { useCampaignsStore } from './store'

vi.mock('@/shared/api/client', async (orig) => ({ ...(await orig<typeof client>()), api: vi.fn() }))
const api = vi.mocked(client.api)

beforeEach(() => {
  setActivePinia(createPinia())
  api.mockReset()
})

describe('campaigns store', () => {
  it('loads the list and resets loading', async () => {
    api.mockResolvedValueOnce({ data: [makeCampaign()] })
    const store = useCampaignsStore()

    const p = store.fetchAll()
    expect(store.loading).toBe(true)
    await p

    expect(store.items).toHaveLength(1)
    expect(store.loading).toBe(false)
  })

  it('resets loading when the request fails', async () => {
    api.mockRejectedValueOnce(new Error('x'))
    const store = useCampaignsStore()

    await expect(store.fetchAll()).rejects.toThrow()
    expect(store.loading).toBe(false)
  })

  it('upserts a fetched campaign', async () => {
    const store = useCampaignsStore()
    store.items = [makeCampaign({ name: 'Old' })]
    api.mockResolvedValueOnce({ data: makeCampaign({ name: 'New' }) })

    await store.fetchOne(1)

    expect(store.items).toHaveLength(1)
    expect(store.items[0].name).toBe('New')
  })

  it('submits changes with the idempotency key header', async () => {
    api.mockResolvedValueOnce({ data: makeChangeRequest({ id: 99 }) })
    const store = useCampaignsStore()

    const result = await store.submitChange(1, { status: 'paused' }, 'key-1')

    expect(result.id).toBe(99) // unwrapped from { data }

    expect(api).toHaveBeenCalledWith('/campaigns/1/changes', {
      method: 'POST',
      body: { changes: { status: 'paused' } },
      headers: { 'Idempotency-Key': 'key-1' },
    })
  })
})
