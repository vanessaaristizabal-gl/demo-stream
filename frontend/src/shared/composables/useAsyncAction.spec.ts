import { describe, expect, it, vi } from 'vitest'
import { useAsyncAction } from './useAsyncAction'

describe('useAsyncAction', () => {
  it('tracks pending and returns the result', async () => {
    const { run, pending } = useAsyncAction(async (n: number) => n * 2)

    const p = run(2)
    expect(pending.value).toBe(true)
    expect(await p).toBe(4)
    expect(pending.value).toBe(false)
  })

  it('captures errors instead of throwing, and clears them on the next run', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok')
    const { run, error } = useAsyncAction(fn)

    expect(await run()).toBeUndefined()
    expect(error.value?.message).toBe('boom')
    expect(await run()).toBe('ok')
    expect(error.value).toBeNull()
  })

  it('ignores a second call while one is in flight (no double submit)', async () => {
    let release!: () => void
    const fn = vi.fn(() => new Promise<void>((r) => (release = r)))
    const { run } = useAsyncAction(fn)

    const first = run()
    await run()
    release()
    await first

    expect(fn).toHaveBeenCalledOnce()
  })
})
