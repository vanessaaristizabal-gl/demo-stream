import { computed } from 'vue'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import { useIdempotencyKey } from '@/shared/composables/useIdempotencyKey'
import { useLabStore } from './store'

/**
 * Approve a previewed batch once and retry what failed. The Idempotency-Key is kept while a request fails (the same
 * intent can be retried safely) and renewed once the server has answered.
 */
export function useBatchApproval() {
  const store = useLabStore()
  const { key, renew } = useIdempotencyKey()

  const approve = useAsyncAction(async () => {
    await store.apply(key.value)
    renew()
  })
  const retry = useAsyncAction(async () => {
    await store.apply(
      key.value,
      store.failures.filter((f) => f.retryable).map((f) => f.id),
    )
    renew()
  })

  return {
    approve: () => approve.run(),
    retry: () => retry.run(),
    pending: computed(() => approve.pending.value || retry.pending.value),
    actionError: computed(() => approve.error.value?.message ?? retry.error.value?.message ?? null),
  }
}
