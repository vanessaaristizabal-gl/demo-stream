---
name: create-pinia-store
description: Add a Pinia store (setup-style, typed) with a Vitest spec that mocks the API client. Use when adding client state or a new API resource to the frontend.
---

# Create a Pinia store

Each feature owns its store: `frontend/src/features/<feature>/store.ts` (setup-style, typed, one resource each). Specs sit beside it as `store.spec.ts`.

```ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/shared/api/client'
import type { Thing, Paginated } from '@/shared/api/types'

export const useThingsStore = defineStore('things', () => {
  const items = ref<Thing[]>([])
  const loading = ref(false)

  async function fetchAll(): Promise<void> {
    loading.value = true
    try {
      items.value = (await api<Paginated<Thing>>('/things')).data
    } finally {
      loading.value = false // always reset, even on error
    }
  }

  return { items, loading, fetchAll }
})
```

Rules:
- Put API types in `src/shared/api/types.ts`. All HTTP goes through `api()` in `src/shared/api/client.ts`; stores never call `fetch`. Single resources arrive as `{ data }` (`Resource<T>`), lists as `{ data, meta }` (`Paginated<T>`): unwrap in the store.
- A store may not import another feature's store (ESLint). Identity (`@/features/auth/store`) is the one shared exception; compose anything else in `src/app`.
- Writes take an idempotency key from the caller (`useIdempotencyKey`) and pass it as the `Idempotency-Key` header.
- Errors propagate (`ApiError`); views wrap actions in `useAsyncAction` to show them. Do not catch-and-ignore in a store.
- Use `computed` for derived state instead of storing it. Consumers use `storeToRefs` when destructuring state.

Spec (`<name>.spec.ts`), pattern used by the existing stores:

```ts
vi.mock('@/shared/api/client', async (orig) => ({ ...(await orig<typeof client>()), api: vi.fn() }))
beforeEach(() => { setActivePinia(createPinia()); vi.mocked(client.api).mockReset() })
```

Test: success path, loading reset on failure, the exact URL/method/headers sent, and that failed actions leave state unchanged. Run `npm test` in `frontend/`.
