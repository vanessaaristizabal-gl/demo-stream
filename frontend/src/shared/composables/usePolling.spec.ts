import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { usePolling } from './usePolling'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('usePolling', () => {
  it('calls on the interval and stops on demand', () => {
    const fn = vi.fn()
    const scope = effectScope()
    const polling = scope.run(() => usePolling(fn, 1000))!

    polling.start()
    polling.start() // idempotent
    vi.advanceTimersByTime(3000)
    expect(fn).toHaveBeenCalledTimes(3)

    polling.stop()
    vi.advanceTimersByTime(3000)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(polling.active.value).toBe(false)
  })

  it('stops when its scope is disposed', () => {
    const fn = vi.fn()
    const scope = effectScope()
    scope.run(() => usePolling(fn, 1000).start())

    scope.stop()
    vi.advanceTimersByTime(5000)
    expect(fn).not.toHaveBeenCalled()
  })
})
