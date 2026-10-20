import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

test('a strategist submits a budget change for approval with an idempotency key', async ({ page }) => {
  const log = await mockApi(page)
  await page.goto('/campaigns')
  await page.getByRole('link', { name: 'Spring Camry' }).click()

  await page.getByLabel('Daily budget (USD)').fill('150')
  await page.getByRole('button', { name: 'Submit for approval' }).click()

  await expect(page.getByRole('status')).toContainText('Change #8 submitted')
  await expect(page.getByRole('status')).toContainText('pending approval')
  expect(log.submissions).toHaveLength(1)
  expect(log.submissions[0].body).toEqual({ changes: { daily_budget: 15000 } })
  expect(log.submissions[0].headers['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/)
})

test('submit stays disabled until the form differs from live state', async ({ page }) => {
  await mockApi(page)
  await page.goto('/campaigns/1')

  await expect(page.getByRole('button', { name: 'Submit for approval' })).toBeDisabled()
  await page.getByLabel('Status').selectOption('paused')
  await expect(page.getByRole('button', { name: 'Submit for approval' })).toBeEnabled()
})

test('locked fields cannot be edited', async ({ page }) => {
  await mockApi(page, { locks: ['name'] })
  await page.goto('/campaigns/1')

  await expect(page.getByLabel('Name')).toBeDisabled()
  await expect(page.getByLabel('Status')).toBeEnabled()
})

test('a server-side rejection is shown and the change is not reported as submitted', async ({ page }) => {
  await mockApi(page, {
    submitError: { status: 409, body: { error: 'field_locked', message: 'Field [name] is locked on this campaign.' } },
  })
  await page.goto('/campaigns/1')

  await page.getByLabel('Name').fill('Renamed')
  await page.getByRole('button', { name: 'Submit for approval' }).click()

  await expect(page.getByRole('alert')).toContainText('locked')
  await expect(page.getByRole('status')).toHaveCount(0)
})
