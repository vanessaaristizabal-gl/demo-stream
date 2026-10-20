import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as client from '@/shared/api/client'
import { makePlatformCatalog, makeSandboxCampaign, makeSandboxDetail } from '@/shared/test/factories'
import type { SandboxCampaignInput } from '@/shared/api/types'
import { useSandboxStore } from './store'

vi.mock('@/shared/api/client', async (orig) => ({ ...(await orig<typeof client>()), api: vi.fn() }))
const api = vi.mocked(client.api)

const input: SandboxCampaignInput = {
  platform: 'meta',
  name: 'RAV4',
  goal: 'leads',
  daily_budget: 9000,
  vehicle: 'RAV4',
  location: 'Dallas',
  landing_url: 'https://dealer.example.com/rav4',
}

beforeEach(() => {
  setActivePinia(createPinia())
  api.mockReset()
})

describe('sandbox store', () => {
  it('loads the list and resets loading, even when the request fails', async () => {
    api.mockResolvedValueOnce({ data: [makeSandboxCampaign()] })
    const store = useSandboxStore()

    const p = store.fetchAll()
    expect(store.loading).toBe(true)
    await p
    expect(store.items).toHaveLength(1)
    expect(api).toHaveBeenCalledWith('/sandbox/campaigns')

    api.mockRejectedValueOnce(new Error('x'))
    await expect(store.fetchAll()).rejects.toThrow()
    expect(store.loading).toBe(false)
  })

  it('loads the platform catalog', async () => {
    api.mockResolvedValueOnce({ data: { platforms: makePlatformCatalog() } })
    const store = useSandboxStore()

    await store.fetchCatalog()

    expect(store.platforms.map((p) => p.platform)).toEqual(['google', 'meta'])
    expect(api).toHaveBeenCalledWith('/sandbox/catalog')
  })

  it('fetches one campaign with its structure and metrics', async () => {
    api.mockResolvedValueOnce({ data: makeSandboxDetail({ id: 9 }) })

    const detail = await useSandboxStore().fetchOne(9)

    expect(api).toHaveBeenCalledWith('/sandbox/campaigns/9')
    expect(detail.structure.groups).toHaveLength(1)
  })

  it('creates with the idempotency key and puts the new campaign first, without duplicating a replay', async () => {
    const store = useSandboxStore()
    store.items = [makeSandboxCampaign({ id: 1 })]
    api.mockResolvedValue({ data: makeSandboxDetail({ id: 2, name: 'RAV4' }) })

    await store.create(input, 'key-1')
    await store.create(input, 'key-1')

    expect(api).toHaveBeenCalledWith('/sandbox/campaigns', { method: 'POST', body: input, headers: { 'Idempotency-Key': 'key-1' } })
    expect(store.items.map((c) => c.id)).toEqual([2, 1])
  })

  it('leaves the list unchanged when creating fails', async () => {
    const store = useSandboxStore()
    store.items = [makeSandboxCampaign({ id: 1 })]
    api.mockRejectedValueOnce(new client.ApiError(422, 'invalid'))

    await expect(store.create(input, 'k')).rejects.toBeInstanceOf(client.ApiError)

    expect(store.items.map((c) => c.id)).toEqual([1])
  })
})
