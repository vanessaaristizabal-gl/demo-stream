import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

test('the changelog shows changes made outside the platform', async ({ page }) => {
  await mockApi(page)
  await page.goto('/changelog')

  const row = page.getByRole('row', { name: /Spring Camry/ })
  await expect(row).toContainText('$100.00')
  await expect(row).toContainText('$200.00')
  await expect(row).toContainText('external')
})
