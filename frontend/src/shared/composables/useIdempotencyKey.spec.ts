import { describe, expect, it } from 'vitest'
import { useIdempotencyKey } from './useIdempotencyKey'

describe('useIdempotencyKey', () => {
  it('keeps the same key until renewed', () => {
    const { key, renew } = useIdempotencyKey()
    const first = key.value

    expect(key.value).toBe(first)
    renew()
    expect(key.value).not.toBe(first)
  })
})
