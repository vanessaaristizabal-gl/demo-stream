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

  it('edits a campaign with a PATCH and an Idempotency-Key and updates the list row', async () => {
    const store = useSandboxStore()
    api.mockResolvedValueOnce({ data: [makeSandboxCampaign()] })
    await store.fetchAll()
    api.mockResolvedValueOnce({ data: makeSandboxDetail({ name: 'Renamed', daily_budget: 20000, status: 'paused' }) })

    await store.update(1, { name: 'Renamed', daily_budget: 20000, status: 'paused' }, 'k-edit')

    expect(api).toHaveBeenLastCalledWith('/sandbox/campaigns/1', {
      method: 'PATCH',
      body: { name: 'Renamed', daily_budget: 20000, status: 'paused' },
      headers: { 'Idempotency-Key': 'k-edit' },
    })
    expect(store.items[0]).toMatchObject({ name: 'Renamed', daily_budget: 20000, status: 'paused' })
  })

  it('a failed edit leaves the list unchanged', async () => {
    const store = useSandboxStore()
    api.mockResolvedValueOnce({ data: [makeSandboxCampaign()] })
    await store.fetchAll()
    api.mockRejectedValueOnce(new client.ApiError(422, 'The daily budget must be at least 100.'))
    await expect(store.update(1, { daily_budget: 50 }, 'k')).rejects.toThrow('at least 100')
    expect(store.items[0].daily_budget).toBe(makeSandboxCampaign().daily_budget)
  })

  it('deletes a campaign with a DELETE and an Idempotency-Key and drops its row', async () => {
    const store = useSandboxStore()
    api.mockResolvedValueOnce({ data: [makeSandboxCampaign(), makeSandboxCampaign({ id: 2 })] })
    await store.fetchAll()
    api.mockResolvedValueOnce(undefined)

    await store.remove(1, 'k-del')

    expect(api).toHaveBeenLastCalledWith('/sandbox/campaigns/1', { method: 'DELETE', headers: { 'Idempotency-Key': 'k-del' } })
    expect(store.items.map((c) => c.id)).toEqual([2])
  })

  it('a failed delete keeps the row', async () => {
    const store = useSandboxStore()
    api.mockResolvedValueOnce({ data: [makeSandboxCampaign()] })
    await store.fetchAll()
    api.mockRejectedValueOnce(new client.ApiError(500, 'Down'))
    await expect(store.remove(1, 'k')).rejects.toThrow('Down')
    expect(store.items).toHaveLength(1)
  })
})
