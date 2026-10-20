import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as client from '@/shared/api/client'
import { useChangelogStore } from './store'

vi.mock('@/shared/api/client', async (orig) => ({ ...(await orig<typeof client>()), api: vi.fn() }))
const api = vi.mocked(client.api)

beforeEach(() => {
  setActivePinia(createPinia())
  api.mockReset()
  api.mockResolvedValue({ data: [] })
})

describe('changelog store', () => {
  it('fetches everything by default', async () => {
    await useChangelogStore().fetchAll()
    expect(api).toHaveBeenCalledWith('/changelog')
  })

  it('filters changes made outside the platform', async () => {
    const store = useChangelogStore()
    store.source = 'external'
    await store.fetchAll()
    expect(api).toHaveBeenCalledWith('/changelog?source=external')
  })
})
