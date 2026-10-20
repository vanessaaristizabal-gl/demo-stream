import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

// playwright.config.ts fixes locale en-US and time zone UTC, so these strings are the same everywhere.
test('campaigns show their creation date as "Oct 1, 2026" in a semantic <time>', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns')

  const row = page.getByRole('row', { name: /Spring Camry/ })
  await expect(row).toContainText('Oct 1, 2026')
  await expect(row.locator('time')).toHaveAttribute('datetime', '2026-10-01T14:30:00+00:00')
  await expect(page.getByRole('columnheader', { name: /Created/ })).toBeVisible()
})

test('the campaign page shows when it was created', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns/1')

  await expect(page.getByText('Created')).toBeVisible()
  await expect(page.locator('time').first()).toHaveText('Oct 1, 2026')
})

test('the changelog shows date and time, and approvals show when a change was requested', async ({ page }) => {
  await mockApi(page, { role: 'approver' })

  await page.goto('/changelog')
  await expect(page.getByRole('row', { name: /Spring Camry/ })).toContainText('Oct 15, 2026, 9:00 AM')

  await page.goto('/approvals')
  await expect(page.getByRole('article', { name: 'Change request 7' })).toContainText('Oct 15, 2026, 10:00 AM')
})
