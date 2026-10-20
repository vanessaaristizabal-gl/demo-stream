import { describe, expect, it } from 'vitest'
import { safeRedirect } from './safeRedirect'

describe('safeRedirect', () => {
  it.each(['/approvals', '/campaigns/7', '/changelog?source=external', '/campaigns/7#top'])('keeps the in-app path %s', (p) => {
    expect(safeRedirect(p)).toBe(p)
  })

  it.each(['https://evil.example', '//evil.example/x', 'javascript:alert(1)', '/\\evil.example', 'campaigns', '', 'http:/evil'])(
    'refuses %s',
    (p) => {
      expect(safeRedirect(p)).toBe('/campaigns')
    },
  )

  it.each([undefined, null, 42, ['/approvals'], {}])('falls back for non-string %s', (p) => {
    expect(safeRedirect(p)).toBe('/campaigns')
  })

  it('never redirects back to the login page itself', () => {
    expect(safeRedirect('/login')).toBe('/campaigns')
    expect(safeRedirect('/login?redirect=/approvals')).toBe('/campaigns')
  })

  it('uses the given fallback', () => {
    expect(safeRedirect('nope', '/approvals')).toBe('/approvals')
  })
})
