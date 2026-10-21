import { expect, test, type Page } from '@playwright/test'
import { mockApi } from './mock-api'

// Campaigns is one page: a tab per provider, live and simulated campaigns in one table, and the CRUD for simulated ones.
async function fillForm(page: Page) {
  await page.getByLabel('Campaign name').fill('RAV4 - Local awareness')
  await page.getByLabel('Daily budget (USD)').fill('90')
  await page.getByLabel('Vehicle model').fill('RAV4')
  await page.getByLabel('Target city').fill('Dallas')
  await page.getByLabel('Landing page').fill('https://dealer.example.com/rav4')
}

test('live and simulated campaigns share one table per provider, with the source and the account on every row', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns')

  await expect(page.getByRole('heading', { level: 1, name: 'Campaigns' })).toBeVisible()
  const tabs = page.getByRole('tablist', { name: 'Campaign sections' })
  await expect(tabs.getByRole('tab', { name: /^Google Ads/ })).toHaveAttribute('aria-selected', 'true')
  const rows = page.getByRole('table', { name: 'Campaigns' }).locator('tbody tr')
  await expect(rows).toHaveCount(3)
  await expect(rows.filter({ hasText: 'Spring Camry' })).toContainText('Live')
  await expect(rows.filter({ hasText: 'Camry - Search leads' })).toContainText('Simulated')
  await expect(rows.filter({ hasText: 'Camry - Search leads' })).toContainText('Demo sandbox')
  await expect(page.getByText('never reach a real account')).toBeVisible()

  await tabs.getByRole('tab', { name: /^Meta Ads/ }).click()
  await expect(page).toHaveURL(/tab=meta/)
  await expect(rows).toHaveCount(1)
  await expect(rows).toContainText('Fall clearance 2025')
})

test('campaigns are filtered by status: active, paused, limited or ended', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns')
  const rows = page.getByRole('table', { name: 'Campaigns' }).locator('tbody tr')
  const status = page.getByRole('radiogroup', { name: 'Status' })
  await expect(status.getByRole('radio')).toHaveText(['All (3)', 'Active (2)', 'Paused (0)', 'Limited (1)', 'Ended (0)'])

  await status.getByRole('radio', { name: /^Limited/ }).click()
  await expect(rows).toHaveCount(1)
  await expect(rows).toContainText('Brand - Search')
  await status.getByRole('radio', { name: /^Paused/ }).click()
  await expect(page.getByText('No campaigns match these filters')).toBeVisible()
  await status.getByRole('radio', { name: /^All/ }).click()
  await expect(rows).toHaveCount(3)
})

test('the account of a live campaign links to the account page', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns')
  await page
    .getByRole('row', { name: /Spring Camry/ })
    .getByRole('link', { name: 'Acme Motors' })
    .click()
  await expect(page).toHaveURL(/\/accounts\/1$/)
  await expect(page.getByRole('heading', { level: 1, name: /Acme Motors/ })).toBeVisible()
})

test('the platform guide is folded under the table, per provider', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns')
  const guide = page.getByRole('button', { name: /^Google Ads \d+ metrics/ })
  await expect(guide).toHaveAttribute('aria-expanded', 'false')
  await guide.click()
  await expect(page.getByRole('cell', { name: 'metrics.cost_micros' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Meta Ads \d+ metrics/ })).toHaveCount(0) // only this provider's guide
})

test('a live campaign is changed through approval; only a simulated one can be deleted', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns')
  await expect(page.getByRole('button', { name: 'Request a change to Spring Camry' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete Spring Camry' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Request a change to Spring Camry' }).click()
  await expect(page).toHaveURL(/\/campaigns\/1$/)
})

test('creating a Meta campaign sends an Idempotency-Key and opens it on the Meta tab list', async ({ page }) => {
  const log = await mockApi(page)
  await page.goto('/campaigns?tab=meta')
  await page.getByRole('button', { name: 'New simulated campaign' }).click()

  await expect(page).toHaveURL(/\/campaigns\/new\?platform=meta/)
  await expect(page.getByRole('heading', { level: 1, name: 'New simulated campaign' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible() // nested page
  await expect(page.getByRole('radio', { name: 'Meta Ads' })).toBeChecked()

  await page.getByLabel('Goal (platform setting)').selectOption('awareness')
  await fillForm(page)
  await page.getByRole('button', { name: 'Create in sandbox' }).click()

  await expect(page).toHaveURL(/\/campaigns\/simulated\/2$/)
  await expect(page.getByRole('heading', { level: 1, name: 'RAV4 - Local awareness' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Metrics' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Reach', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Structure' }).click()
  await page.getByRole('button', { name: /Ad set: Local audience/ }).click()
  await expect(page.getByRole('heading', { name: /Ad set: Local audience/ })).toBeVisible()

  expect(log.sandboxCreations).toHaveLength(1)
  expect(log.sandboxCreations[0].headers['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/)
  expect(log.sandboxCreations[0].body).toMatchObject({
    platform: 'meta',
    name: 'RAV4 - Local awareness',
    goal: 'awareness',
    daily_budget: 9000,
  })
})

test('a creation error keeps the form and says why', async ({ page }) => {
  await mockApi(page, {
    sandboxError: {
      status: 422,
      body: { error: 'idempotency_conflict', message: 'This Idempotency-Key was already used for a different campaign.' },
    },
  })
  await page.goto('/campaigns/new')
  await fillForm(page)
  await page.getByRole('button', { name: 'Create in sandbox' }).click()
  await expect(page.getByText('already used for a different campaign')).toBeVisible()
  await expect(page).toHaveURL(/\/campaigns\/new/)
  await expect(page.getByLabel('Campaign name')).toHaveValue('RAV4 - Local awareness')
})

test('a simulated campaign is edited from the table or its Settings tab, with an Idempotency-Key', async ({ page }) => {
  const log = await mockApi(page)
  await page.goto('/campaigns')
  await page.getByRole('button', { name: 'Edit Camry - Search leads' }).click()

  await expect(page).toHaveURL(/\/campaigns\/simulated\/1\?tab=settings/)
  await expect(page.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('Campaign name')).toHaveValue('Camry - Search leads')
  await page.getByLabel('Campaign name').fill('Camry - Search leads v2')
  await page.getByLabel('Status').selectOption('paused')
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(page.getByText('Changes saved.')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Camry - Search leads v2' })).toBeVisible()
  expect(log.sandboxEdits).toHaveLength(1)
  expect(log.sandboxEdits[0].headers['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/)
  expect(log.sandboxEdits[0].body).toMatchObject({ name: 'Camry - Search leads v2', status: 'paused' })
})

test('deleting a simulated campaign asks first, sends an Idempotency-Key, and lands on a confirmation', async ({ page }) => {
  const log = await mockApi(page)
  await page.goto('/campaigns')
  await page.getByRole('button', { name: 'Delete Camry - Search leads' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('Delete this simulated campaign?')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('link', { name: 'Camry - Search leads' })).toBeVisible()
  expect(log.sandboxDeletions).toHaveLength(0)

  await page.getByRole('button', { name: 'Delete Camry - Search leads' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete campaign' }).click()
  await expect(page.getByText('Deleted Camry - Search leads.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Camry - Search leads' })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1, name: 'Campaigns' })).toBeFocused()
  expect(log.sandboxDeletions[0].headers['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/)
})

test('a simulated campaign is a nested page: breadcrumb trail and Back to Campaigns; old sandbox links redirect', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns')
  await page.getByRole('link', { name: 'Camry - Search leads' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Camry - Search leads' })).toBeVisible()
  const trail = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(trail.getByRole('link', { name: 'Campaigns' })).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/campaigns$/)

  await page.goto('/sandbox')
  await expect(page).toHaveURL(/\/campaigns$/)
  await page.goto('/sandbox/1')
  await expect(page).toHaveURL(/\/campaigns\/simulated\/1$/)
})

test('tabs and the folded guide work with the keyboard alone', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns')
  await page.getByRole('tab', { name: /^Google Ads/ }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: /^Meta Ads/ })).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowLeft')
  const guide = page.getByRole('button', { name: /^Google Ads \d+ metrics/ })
  await guide.focus()
  await page.keyboard.press('Enter')
  await expect(guide).toHaveAttribute('aria-expanded', 'true')
})

test('an unknown simulated campaign shows the not-found page inside the shell', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns/simulated/abc')
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/not found/i)
})

test('the pages do not scroll sideways at 320 px', async ({ page }) => {
  await mockApi(page)
  await page.setViewportSize({ width: 320, height: 700 })
  for (const path of [
    '/campaigns',
    '/campaigns?tab=meta',
    '/campaigns/new',
    '/campaigns/simulated/1',
    '/campaigns/simulated/1?tab=settings',
    '/campaigns/simulated/1?tab=structure',
  ]) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `${path} scrolls horizontally`).toBeLessThanOrEqual(0)
  }
})
