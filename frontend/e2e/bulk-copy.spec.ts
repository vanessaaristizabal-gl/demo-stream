import { expect, test, type Page } from '@playwright/test'
import { mockApi } from './mock-api'

// Two operations reached from Campaigns, on the playbooks mock served by Vite (one state, so these run in order).
test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/playbooks/reset')
  await mockApi(page, { role: 'strategist' })
})

const open = async (page: Page, button: string, heading: string) => {
  await page.goto('/campaigns')
  await page.getByRole('button', { name: button }).click()
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
}

test.describe('bulk budget change', () => {
  test('previews 300 campaigns, approves once, shows the 12 failures, retries them and shows the receipts', async ({ page }) => {
    await open(page, 'Bulk budget change', 'Bulk budget change')
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Bulk budget change')
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible() // nested page

    const held = page.getByRole('term').filter({ hasText: 'Held' }).locator('xpath=following-sibling::dd')
    await expect(held).toHaveText('15')
    await page.getByRole('tab', { name: /^Held/ }).click()
    await expect(page.getByRole('table', { name: 'Held items and the reason for each' })).toContainText('Locked by manufacturer rule')

    await page.getByRole('button', { name: 'Approve 285 changes' }).click()
    const result = page.getByRole('region', { name: 'Result' })
    await expect(result).toContainText('273 applied, 12 failed')
    await expect(result).toContainText('5 stopped at the provider rate limit')
    await expect(result).toBeFocused()
    await expect(page.getByRole('table', { name: 'Failed items' }).locator('tbody tr')).toHaveCount(12)

    await page.getByRole('button', { name: 'Retry failed' }).click()
    await expect(result).toContainText('All 285 changes were applied.')
    await expect(page.getByRole('button', { name: 'Retry failed' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Changelog receipts (285)' })).toBeVisible()
  })

  test('works with the keyboard alone', async ({ page }) => {
    await open(page, 'Bulk budget change', 'Bulk budget change')
    const approve = page.getByRole('button', { name: /^Approve/ })
    await expect(approve).toBeVisible()
    await approve.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('region', { name: 'Result' })).toContainText('273 applied, 12 failed')
    await page.getByRole('button', { name: 'Retry failed' }).focus()
    await page.keyboard.press('Space')
    await expect(page.getByRole('region', { name: 'Result' })).toContainText('All 285 changes were applied.')
  })

  test('shows an error with Try again when the preview fails', async ({ page }) => {
    let fail = true
    await page.route('**/api/playbooks/bulk/preview', async (route) => {
      if (fail)
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Preview service is down' }) })
      return route.fallback()
    })
    await open(page, 'Bulk budget change', 'Bulk budget change')
    await expect(page.getByRole('alert')).toContainText('Preview service is down')
    fail = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('button', { name: /^Approve/ })).toBeVisible()
  })
})

test.describe('ad copy', () => {
  test('counts the filled-in text, flags overflow per dealer and unknown or malformed placeholders', async ({ page }) => {
    await open(page, 'Ad copy', 'Ad copy')
    const field = page.getByLabel('Ad headline template')
    await expect(page.getByText('Peak Subaru - 0% APR', { exact: true })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'characters for Peak Subaru' })).toHaveText(
      '20 / 30 characters for Peak Subaru',
    )

    await field.fill('{{ dealer.name }} - 0% APR this month!')
    await expect(page.getByRole('alert')).toContainText('character limit')
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await field.fill('{{ dealer.nme }}')
    await expect(page.getByRole('alert')).toHaveText('Unknown placeholder: dealer.nme')
    await field.fill('{{ dealer.name }')
    await expect(page.getByRole('alert')).toContainText('Malformed placeholder')
    await field.fill('{{ dealer.name }} 0% APR')
    await expect(page.getByText('Too long for 2 dealers:')).toBeVisible()
  })
})

test('the two pages do not scroll sideways at 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  for (const path of ['/campaigns/bulk', '/campaigns/copy', '/accounts', '/accounts/1', '/accounts/1?tab=launch']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `${path} scrolls horizontally`).toBeLessThanOrEqual(0)
  }
})
