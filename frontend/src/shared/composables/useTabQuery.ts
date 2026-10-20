import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * The selected tab lives in the URL (`?tab=metrics`), so a tab can be linked, reloaded and reached with the browser's Back
 * button. An unknown or missing value falls back to the default. Switching replaces the entry instead of piling up history.
 */
export function useTabQuery(allowed: readonly string[], fallback: string) {
  const route = useRoute()
  const router = useRouter()

  return computed<string>({
    get: () => {
      const value = route.query.tab
      return typeof value === 'string' && allowed.includes(value) ? value : fallback
    },
    set: (next) => {
      void router.replace({ query: { ...route.query, tab: next === fallback ? undefined : next } })
    },
  })
}
