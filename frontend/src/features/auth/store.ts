import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/shared/api/client'
import type { Role, User } from '@/shared/api/types'

const TOKEN_KEY = 'stream.token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  function can(...roles: Role[]): boolean {
    return user.value !== null && roles.includes(user.value.role)
  }

  async function login(email: string, password: string): Promise<void> {
    const res = await api<{ token: string; user: User }>('/login', { method: 'POST', body: { email, password } })
    token.value = res.token
    user.value = res.user
    localStorage.setItem(TOKEN_KEY, res.token)
  }

  async function fetchMe(): Promise<void> {
    user.value = await api<User>('/me')
  }

  function clear(): void {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  async function logout(): Promise<void> {
    try {
      await api('/logout', { method: 'POST' })
    } finally {
      clear()
    }
  }

  return { token, user, isAuthenticated, can, login, fetchMe, logout, clear }
})
