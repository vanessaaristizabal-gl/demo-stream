import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as client from '@/shared/api/client'
import { makeChangeRequest } from '@/shared/test/factories'
import { useChangeRequestsStore } from './store'

vi.mock('@/shared/api/client', async (orig) => ({ ...(await orig<typeof client>()), api: vi.fn() }))
const api = vi.mocked(client.api)

beforeEach(() => {
  setActivePinia(createPinia())
  api.mockReset()
})

describe('changeRequests store', () => {
  it('filters by status in the query string', async () => {
    api.mockResolvedValueOnce({ data: [] })
    await useChangeRequestsStore().fetchAll('blocked')
    expect(api).toHaveBeenCalledWith('/change-requests?status=blocked')
  })

  it('exposes only pending requests', () => {
    const store = useChangeRequestsStore()
    store.items = [makeChangeRequest({ id: 1 }), makeChangeRequest({ id: 2, status: 'applied' })]

    expect(store.pending.map((r) => r.id)).toEqual([1])
  })

  it('updates the request in place after approve', async () => {
    const store = useChangeRequestsStore()
    store.items = [makeChangeRequest({ id: 7 })]
    api.mockResolvedValueOnce({ data: { id: 7, status: 'applied' } })

    await store.approve(7)

    expect(api).toHaveBeenCalledWith('/change-requests/7/approve', { method: 'POST' })
    expect(store.items[0].status).toBe('applied')
    expect(store.items[0].campaign?.name).toBe('Spring Camry') // merged, not replaced
    expect(store.pending).toHaveLength(0)
  })

  it('keeps the request pending when the decision fails', async () => {
    const store = useChangeRequestsStore()
    store.items = [makeChangeRequest()]
    api.mockRejectedValueOnce(new client.ApiError(403, 'self approval', 'self_approval'))

    await expect(store.approve(7)).rejects.toMatchObject({ code: 'self_approval' })
    expect(store.pending).toHaveLength(1)
  })
})
