import { onScopeDispose, ref } from 'vue'

/** Calls `fn` every `intervalMs` until stopped; stops automatically with the owning scope. */
export function usePolling(fn: () => unknown, intervalMs: number) {
  const active = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  function start(): void {
    if (timer) return
    active.value = true
    timer = setInterval(() => void fn(), intervalMs)
  }

  function stop(): void {
    if (timer) clearInterval(timer)
    timer = undefined
    active.value = false
  }

  onScopeDispose(stop)

  return { start, stop, active }
}
