import { describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM script, no types
import { isAllowed, isBanned, checkBackend, checkFrontend } from './check-licenses.mjs'

describe('license policy', () => {
  it.each(['MIT', 'ISC', 'Apache-2.0', 'BSD-3-Clause', '0BSD', 'BlueOak-1.0.0', 'OFL-1.1'])('allows %s', (l) => {
    expect(isAllowed(l)).toBe(true)
  })

  it.each(['GPL-3.0-only', 'AGPL-3.0', 'LGPL-2.1', 'SEE LICENSE IN LICENSE.md', 'UNLICENSED', 'UNKNOWN', 'Commercial', '', undefined])(
    'rejects %s',
    (l) => {
      expect(isAllowed(l)).toBe(false)
    },
  )

  it('accepts a dual license when one option is free (we pick that one)', () => {
    expect(isAllowed('(MIT OR CC0-1.0)')).toBe(true)
    expect(isAllowed('BSD-3-Clause,GPL-2.0-only,GPL-3.0-only')).toBe(true) // composer lists alternatives with commas
    expect(isAllowed('GPL-3.0-only OR Commercial')).toBe(false)
  })

  it('requires every part of an AND expression', () => {
    expect(isAllowed('MIT AND Apache-2.0')).toBe(true)
    expect(isAllowed('MIT AND GPL-3.0-only')).toBe(false)
  })

  it('allows file-level copyleft (MPL-2.0) only for tools that are not shipped', () => {
    expect(isAllowed('MPL-2.0')).toBe(false)
    expect(isAllowed('MPL-2.0', { devOnly: true })).toBe(true)
  })

  it.each(['@fortawesome/pro-solid-svg-icons', 'ag-grid-enterprise', '@syncfusion/ej2-vue-grids', '@mui/x-data-grid-pro'])(
    'bans %s by name',
    (n) => {
      expect(isBanned(n)).toBe(true)
    },
  )

  it.each(['vue', 'reka-ui', 'lucide-vue-next', 'ag-grid-community', '@fontsource-variable/inter'])('does not ban %s', (n) => {
    expect(isBanned(n)).toBe(false)
  })
})

describe('this repository', () => {
  it('passes the policy today (frontend)', () => {
    expect(checkFrontend().problems).toEqual([])
  })

  it('passes the policy today (backend)', () => {
    expect(checkBackend().problems).toEqual([])
  })
})
