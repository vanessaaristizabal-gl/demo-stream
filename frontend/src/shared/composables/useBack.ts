import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * "Back" for nested pages only (a route with `meta.parent`, like a campaign's detail). Top-level pages
 * (campaigns, approvals, changelog) are the destinations of the main navigation, so Back adds nothing there.
 * It returns to wherever the person came from; if the page was opened directly (no history, e.g. a shared
 * link) it goes to the declared parent, so it is never a dead end.
 */
export function useBack() {
  const router = useRouter()
  const route = useRoute()

  const previous = computed(() => {
    void route.fullPath // re-evaluate on every navigation
    const back = router.options.history.state.back
    return typeof back === 'string' && back !== '/login' ? back : null
  })
  const parent = computed(() => (route.meta.parent ? { name: route.meta.parent } : null))

  const canGoBack = computed(() => parent.value !== null)

  async function back(): Promise<void> {
    if (previous.value !== null) router.back()
    else if (parent.value) await router.push(parent.value)
  }

  return { canGoBack, back }
}
