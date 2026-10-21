import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs tool without type declarations
import { checkTree, parseLighthouse, parseTrace } from './devtools-audit.mjs'

// Samples are real output of the Chrome DevTools MCP server (chrome-devtools-mcp 1.11.0).
const LIGHTHOUSE = `## Lighthouse audit results
Mode: navigation
Device: desktop
### Category scores
- Accessibility: 100 (accessibility)
- Best Practices: 96 (best-practices)
- SEO: 82 (seo)
### Failed audits
- meta-description [seo]: Document does not have a meta description (score: 0)
  Meta descriptions may be included in search results.
- robots-txt [seo]: robots.txt is not valid (22 errors found) (score: 0)
`
const TRACE = `Metrics (lab / observed):
  - LCP: 451 ms, event: (eventKey: r-8925, ts: 38937950791), nodeId: 36
  - CLS: 0.04, event: (eventKey: s-8823, ts: 38937946568)`
const TREE = `## Latest page snapshot
uid=1_0 RootWebArea "Stream" url="http://localhost:5173/campaigns"
  uid=1_1 banner
  uid=1_2 navigation "Main"
  uid=1_3 main
    uid=1_4 heading "Campaigns" level="1"
    uid=1_5 button "New simulated campaign"`

describe('parseLighthouse', () => {
  it('reads the category scores and the failed audits with their category', () => {
    expect(parseLighthouse(LIGHTHOUSE)).toEqual({
      accessibility: 100,
      bestPractices: 96,
      seo: 82,
      failed: [
        { id: 'meta-description', category: 'seo', title: 'Document does not have a meta description' },
        { id: 'robots-txt', category: 'seo', title: 'robots.txt is not valid (22 errors found)' },
      ],
    })
  })
  it('returns null for a category that is missing', () => {
    expect(parseLighthouse('nothing').accessibility).toBeNull()
  })
})

describe('parseTrace', () => {
  it('reads LCP and CLS', () => expect(parseTrace(TRACE)).toEqual({ lcpMs: 451, cls: 0.04 }))
  it('returns null when the trace has no metrics', () => expect(parseTrace('empty')).toEqual({ lcpMs: null, cls: null }))
})

describe('checkTree', () => {
  it('accepts a page with one h1, landmarks and named controls', () => expect(checkTree(TREE)).toEqual([]))

  it('reports a missing h1, a missing main landmark and an unnamed button', () => {
    const bad = TREE.replace('heading "Campaigns" level="1"', 'heading "Campaigns" level="2"')
      .replace('uid=1_3 main', 'uid=1_3 generic')
      .replace('button "New simulated campaign"', 'button')
    expect(checkTree(bad)).toEqual(['expected one h1, found 0', 'no main landmark', 'a button has no accessible name: uid=1_5 button'])
  })

  it('does not require navigation or a banner on a public page', () => {
    const login = 'uid=1_0 RootWebArea "Stream"\n  uid=1_1 main\n    uid=1_2 heading "Sign in" level="1"'
    expect(checkTree(login, { public: true })).toEqual([])
    expect(checkTree(login)).toEqual(['no navigation landmark', 'no banner (header) landmark'])
  })

  it('reports a second h1', () => {
    expect(checkTree(`${TREE}\n    uid=1_6 heading "Again" level="1"`)).toEqual(['expected one h1, found 2'])
  })
})
