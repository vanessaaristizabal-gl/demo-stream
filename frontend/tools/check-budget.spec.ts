import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs tool without type declarations
import { checkBudget } from './check-budget.mjs'

const budget = { initialGzipKb: 100, chunkGzipKb: 8 }
const kb = (n: number) => n * 1024

describe('checkBudget', () => {
  it('passes when the initial load and every chunk are within budget', () => {
    expect(checkBudget({ 'index.js': kb(60), 'ds.js': kb(30), 'view.js': kb(7) }, new Set(['index.js', 'ds.js']), budget)).toEqual([])
  })

  it('fails when the initial JavaScript grows past the budget', () => {
    const violations = checkBudget({ 'index.js': kb(70), 'ds.js': kb(40) }, new Set(['index.js', 'ds.js']), budget)
    expect(violations).toEqual(['initial JavaScript is 110.0 kB gzip, budget 100 kB'])
  })

  it('fails when a single route chunk is too big, but never counts initial files against the chunk limit', () => {
    const violations = checkBudget({ 'index.js': kb(50), 'big-view.js': kb(9) }, new Set(['index.js']), budget)
    expect(violations).toEqual(['big-view.js is 9.0 kB gzip, chunk budget 8 kB'])
  })
})
