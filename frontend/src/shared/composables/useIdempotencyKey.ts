import { ref } from 'vue'

/**
 * One key per user intent. Keep the same key while retrying a failed submit so the
 * server can de-duplicate; call renew() only once the intent has completed.
 */
export function useIdempotencyKey() {
  const key = ref<string>(crypto.randomUUID())

  function renew(): void {
    key.value = crypto.randomUUID()
  }

  return { key, renew }
}
