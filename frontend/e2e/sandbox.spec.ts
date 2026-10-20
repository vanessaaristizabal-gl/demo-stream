import { expect, test, type Page } from '@playwright/test'
import { mockApi } from './mock-api'

async function fillForm(page: Page) {
  await page.getByLabel('Campaign name').fill('RAV4 - Local awareness')
  await page.getByLabel('Daily budget (USD)').fill('90')
  await page.getByLabel('Vehicle model').fill('RAV4')
  await page.getByLabel('Target city').fill('Dallas')
  await page.getByLabel('Landing page').fill('https://dealer.example.com/rav4')
}

test('the sandbox lists simulated campaigns and explains what each platform collects', async ({ page }) => {
  await mockApi(page)
  await page.goto('/sandbox')

  await expect(page.getByRole('heading', { level: 1, name: 'Sandbox' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Camry - Search leads' })).toBeVisible()
  await expect(page.getByText('never reach a real ad account')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What each platform collects' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'metrics.cost_micros' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'spend', exact: true })).toBeVisible()
})

test('creating a Meta campaign sends an Idempotency-Key and opens its structure and metrics', async ({ page }) => {
  const log = await mockApi(page)
  await page.goto('/sandbox')
  await expect(page.getByRole('heading', { level: 1, name: 'Sandbox' })).toBeVisible()

  await page.getByRole('radio', { name: 'Meta Ads' }).click()
  await page.getByLabel('Goal (platform setting)').selectOption('awareness')
  await fillForm(page)
  await page.getByRole('button', { name: 'Create in sandbox' }).click()

  await expect(page).toHaveURL(/\/sandbox\/2$/)
  await expect(page.getByRole('heading', { level: 1, name: 'RAV4 - Local awareness' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Structure' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Ad set: Local audience/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Metrics/ })).toBeVisible()
  await expect(page.getByText('Reach', { exact: true })).toBeVisible()

  expect(log.sandboxCreations).toHaveLength(1)
  expect(log.sandboxCreations[0].headers['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/)
  expect(log.sandboxCreations[0].body).toEqual({
    platform: 'meta',
    name: 'RAV4 - Local awareness',
    goal: 'awareness',
    daily_budget: 9000,
    vehicle: 'RAV4',
    location: 'Dallas',
    landing_url: 'https://dealer.example.com/rav4',
  })
})

test('a simulated campaign is a nested page: breadcrumb trail and Back to the sandbox', async ({ page }) => {
  await mockApi(page)
  await page.goto('/sandbox')
  await page.getByRole('link', { name: 'Camry - Search leads' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Camry - Search leads' })).toBeVisible()
  const trail = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(trail.getByRole('link', { name: 'Sandbox' })).toBeVisible()
  await expect(trail.getByText('Camry - Search leads')).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/sandbox$/)
})

test('a server error keeps the form and says why', async ({ page }) => {
  await mockApi(page, {
    sandboxError: {
      status: 422,
      body: { error: 'idempotency_conflict', message: 'This Idempotency-Key was already used for a different campaign.' },
    },
  })
  await page.goto('/sandbox')
  await expect(page.getByRole('heading', { level: 1, name: 'Sandbox' })).toBeVisible()

  await fillForm(page)
  await page.getByRole('button', { name: 'Create in sandbox' }).click()

  await expect(page.getByText('already used for a different campaign')).toBeVisible()
  await expect(page).toHaveURL(/\/sandbox$/)
  await expect(page.getByLabel('Campaign name')).toHaveValue('RAV4 - Local awareness')
})

test('an unknown simulated campaign shows the not-found page inside the shell', async ({ page }) => {
  await mockApi(page)
  await page.goto('/sandbox/abc')

  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/not found/i)
})
