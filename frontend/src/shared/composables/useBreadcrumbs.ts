import { computed, onScopeDispose, reactive, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface Crumb {
  label: string
  href: string
}

// Labels that only a page can know (e.g. the campaign's name), keyed by the page's path (not fullPath, so
// a query or hash change keeps the label, and not captured once, so a reused component follows navigation).
const dynamicLabels = reactive(new Map<string, string>())

/** A page calls this to name its own breadcrumb once its data has loaded. */
export function useCrumbLabel(label: MaybeRefOrGetter<string | null | undefined>): void {
  const route = useRoute()
  let key: string | null = null

  watchEffect(() => {
    const next = route.path
    const value = toValue(label)
    if (key !== null && key !== next) dynamicLabels.delete(key) // the same component moved to another page
    key = next
    if (value) dynamicLabels.set(key, value)
    else dynamicLabels.delete(key)
  })
  onScopeDispose(() => {
    if (key !== null) dynamicLabels.delete(key)
  })
}

/**
 * The trail for the current page: Home, then each ancestor declared with `meta.parent`, then the page itself.
 * Routes declare `meta: { crumb: 'Label', parent?: 'routeName' }`; pages without `crumb` (login) have no trail.
 */
export function useBreadcrumbs() {
  const route = useRoute()
  const router = useRouter()

  return computed<Crumb[]>(() => {
    if (!route.meta.crumb) return []

    const own = dynamicLabels.get(route.path) ?? route.meta.crumb
    const trail: Crumb[] = [{ label: own, href: route.fullPath }]

    let parent = route.meta.parent
    while (parent) {
      const resolved = router.resolve({ name: parent })
      trail.unshift({ label: resolved.meta.crumb ?? parent, href: resolved.href })
      parent = resolved.meta.parent
    }

    return [{ label: 'Home', href: router.resolve({ name: 'campaigns' }).href }, ...trail]
  })
}
