import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs tool without type declarations
import { findGaps, parseSpec } from './check-traceability.mjs'

const doc = `# Spec: Demo
Component: features/x/Demo

## States
- loading
- partial-failure

## Acceptance criteria
- AC-1: shows the title
- AC-2: shows the failures

## Edge cases
- AC-3: handles empty

## Out of scope
- AC-9: not a criterion
`

describe('parseSpec', () => {
  it('reads the name, component, states and criteria (including edge cases, excluding out of scope)', () => {
    expect(parseSpec(doc)).toEqual({
      name: 'Demo',
      component: 'features/x/Demo',
      states: ['loading', 'partial-failure'],
      criteria: ['AC-1', 'AC-2', 'AC-3'],
    })
  })
})

describe('findGaps', () => {
  const spec = parseSpec(doc)
  const tests = `it('AC-1: a', () => {})\nit("AC-2: b", () => {})\nit('AC-3: c', () => {})`
  const stories = 'export const Loading = {}\nexport const PartialFailure = {}'

  it('finds nothing when every criterion has a test and every state a story', () => {
    expect(findGaps(spec, tests, stories)).toEqual([])
  })

  it('reports a criterion without a test, a test without a criterion and a state without a story', () => {
    const gaps = findGaps(spec, `it('AC-1: a', () => {})\nit('AC-7: z', () => {})`, 'export const Loading = {}')
    expect(gaps).toEqual([
      'AC-2 has no test titled "AC-2: ..."',
      'AC-3 has no test titled "AC-3: ..."',
      'AC-7 is tested but is not in the spec',
      'state "partial-failure" has no story named PartialFailure',
    ])
  })

  it('does not count a test that merely mentions an id outside its title', () => {
    expect(findGaps(spec, `it('works', () => { /* AC-1: */ })`, stories)).toContain('AC-1 has no test titled "AC-1: ..."')
  })
})
