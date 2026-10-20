import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

// Performance budget for the 2,000-row list. The numbers live in perf-budget.json so CI and people read the same limits.
// The build fails when one is exceeded. Timings are generous on purpose (a shared CI runner is slow); the structural limits
// (rows in the DOM, bytes per response) are exact, because those are the ones a regression changes by an order of magnitude.
const budget = JSON.parse(readFileSync(new URL('../perf-budget.json', import.meta.url), 'utf8')).denseList as {
  maxDomNodes: number
  maxRowsRendered: number
  maxFirstRowsMs: number
  maxFilterMs: number
  maxResponseKb: number
}

test.beforeEach(async ({ page }) => {
  await mockApi(page, { role: 'strategist' })
})

test('the dense list stays inside its performance budget', async ({ page }) => {
  const responseBytes: number[] = []
  page.on('response', async (r) => {
    if (new URL(r.url()).pathname === '/api/lab/rows') responseBytes.push((await r.body()).length)
  })

  const start = Date.now()
  await page.goto('/lab/rows')
  await expect(page.getByRole('table', { name: 'Campaigns' }).locator('tbody tr').first()).toBeVisible()
  const firstRowsMs = Date.now() - start

  const rendered = await page.getByRole('table', { name: 'Campaigns' }).locator('tbody tr').count()
  const domNodes = await page.evaluate(() => document.getElementsByTagName('*').length)

  const filterStart = Date.now()
  await page.getByRole('radio', { name: 'Paused' }).click()
  await expect(page.getByText('500 campaigns', { exact: true })).toBeVisible()
  const filterMs = Date.now() - filterStart

  expect(rendered, 'rows in the DOM').toBeLessThanOrEqual(budget.maxRowsRendered)
  expect(domNodes, 'DOM nodes').toBeLessThanOrEqual(budget.maxDomNodes)
  expect(Math.max(...responseBytes) / 1024, 'largest list response (kB)').toBeLessThanOrEqual(budget.maxResponseKb)
  expect(firstRowsMs, 'ms until the first rows are visible').toBeLessThanOrEqual(budget.maxFirstRowsMs)
  expect(filterMs, 'ms to filter 2,000 rows').toBeLessThanOrEqual(budget.maxFilterMs)
})

test('asking the server for every row at once is refused by the page cap, so no client can load all 2,000', async ({ request }) => {
  const response = await request.get('/api/lab/rows?per_page=2000')
  const body = (await response.json()) as { data: unknown[]; meta: { total: number; per_page: number } }
  expect(body.meta.total).toBe(2000)
  expect(body.data.length).toBeLessThanOrEqual(budget.maxRowsRendered)
})
