import { ref } from 'vue'
import { ApiError } from '@/shared/api/client'

/** Wraps an async function with pending/error state and prevents double submits. */
export function useAsyncAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const pending = ref(false)
  const error = ref<ApiError | Error | null>(null)

  async function run(...args: A): Promise<R | undefined> {
    if (pending.value) return undefined
    pending.value = true
    error.value = null
    try {
      return await fn(...args)
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      return undefined
    } finally {
      pending.value = false
    }
  }

  return { run, pending, error }
}
