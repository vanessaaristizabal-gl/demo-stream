import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as client from '@/shared/api/client'
import { useAuthStore } from './store'

vi.mock('@/shared/api/client', async (orig) => ({ ...(await orig<typeof client>()), api: vi.fn() }))
const api = vi.mocked(client.api)

beforeEach(() => {
  setActivePinia(createPinia())
  api.mockReset()
})

describe('auth store', () => {
  it('stores token and user on login and persists the token', async () => {
    api.mockResolvedValueOnce({ token: 't1', user: { id: 1, name: 'A', email: 'a@x', role: 'approver' } })
    const auth = useAuthStore()

    await auth.login('a@x', 'pw')

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.can('approver')).toBe(true)
    expect(auth.can('admin')).toBe(false)
    expect(localStorage.getItem('stream.token')).toBe('t1')
  })

  it('does not authenticate when login fails', async () => {
    api.mockRejectedValueOnce(new Error('Invalid credentials.'))
    const auth = useAuthStore()

    await expect(auth.login('a@x', 'bad')).rejects.toThrow('Invalid')
    expect(auth.isAuthenticated).toBe(false)
  })

  it('restores the token from storage', () => {
    localStorage.setItem('stream.token', 'saved')
    setActivePinia(createPinia())

    expect(useAuthStore().token).toBe('saved')
  })

  it('clears local state on logout even if the server call fails', async () => {
    localStorage.setItem('stream.token', 'saved')
    setActivePinia(createPinia())
    const auth = useAuthStore()
    api.mockRejectedValueOnce(new Error('network'))

    await expect(auth.logout()).rejects.toThrow()

    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('stream.token')).toBeNull()
  })

  it('cannot() anything before the user is loaded', () => {
    expect(useAuthStore().can('strategist', 'approver', 'admin')).toBe(false)
  })
})
