import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as client from '@/shared/api/client'
import { useSystemStore } from './store'

vi.mock('@/shared/api/client', async (orig) => ({ ...(await orig<typeof client>()), api: vi.fn() }))
const api = vi.mocked(client.api)

beforeEach(() => {
  setActivePinia(createPinia())
  api.mockReset()
})

describe('system store', () => {
  it('loads the emergency stop flag', async () => {
    api.mockResolvedValueOnce({ active: true })
    const store = useSystemStore()
    await store.load()
    expect(store.emergencyStop).toBe(true)
  })

  it('trusts the server response when toggling, not the request', async () => {
    api.mockResolvedValueOnce({ active: false })
    const store = useSystemStore()
    await store.setEmergencyStop(true)
    expect(store.emergencyStop).toBe(false)
  })
})
